<script>
	// Sphère du hero, un petit jouet :
	//   - on l'attrape et on la lance, elle ralentit en douceur (lerp) ;
	//   - un clic bascule entre l'or et le verre fumé, avec un fondu ;
	//   - la lumière suit la souris, ou l'inclinaison du téléphone ;
	//   - plus elle tourne vite, plus ses facettes s'écartent, puis se remettent en place ;
	//   - un record de vitesse (tours/s) invite à la lancer plus fort.
	//
	// Le rendu passe par un shader minimal : l'éclairage de chaque matière est précalculé
	// dans une matcap de moins de 8 Ko, et chaque facette lit un point différent de cette
	// image. Three.js est chargé en différé, une fois la page affichée et le navigateur au
	// repos : il ne pèse ni sur le premier affichage ni sur le LCP.
	import { onMount } from 'svelte';

	let { labels } = $props();

	const MATERIALS = ['gold', 'glass'];
	const RECORD_KEY = 'portfolio:sphere-record';

	let container;
	let hinted = $state(false);
	let ready = $state(false);
	let materialIndex = $state(0);
	let record = $state(0); // meilleur score en tours/s, 0 = pas encore joué
	let newRecord = $state(false);
	let liveSpeed = $state(0); // vitesse actuelle en tours/s, au dixième
	let newRecordTimer;

	const nf = $derived(
		new Intl.NumberFormat(labels.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
	);

	onMount(() => {
		try {
			record = Number(localStorage.getItem(RECORD_KEY)) || 0;
		} catch {
			// stockage indisponible (navigation privée) : le record ne sera pas mémorisé
		}

		let destroyed = false;
		let cleanup;
		let idleId;

		const start = async () => {
			// Import déstructuré : seules ces classes finissent dans le bundle
			const {
				BufferAttribute,
				DoubleSide,
				Group,
				IcosahedronGeometry,
				Mesh,
				PerspectiveCamera,
				Quaternion,
				Raycaster,
				Scene,
				ShaderMaterial,
				SRGBColorSpace,
				TextureLoader,
				Vector2,
				Vector3,
				WebGLRenderer
			} = await import('three');
			const three = {
				BufferAttribute,
				DoubleSide,
				Group,
				IcosahedronGeometry,
				Mesh,
				PerspectiveCamera,
				Quaternion,
				Raycaster,
				Scene,
				ShaderMaterial,
				SRGBColorSpace,
				Vector2,
				Vector3,
				WebGLRenderer
			};
			const loader = new TextureLoader();
			// L'or d'abord, pour afficher la sphère au plus vite ; les autres suivent
			const first = await loader.loadAsync(`/media/matcap-${MATERIALS[0]}.jpg`);
			if (destroyed) return first.dispose();
			const textures = [first];
			cleanup = init(three, textures, () => (ready = true));
			for (const name of MATERIALS.slice(1)) {
				const texture = await loader.loadAsync(`/media/matcap-${name}.jpg`);
				if (destroyed) return texture.dispose();
				texture.colorSpace = SRGBColorSpace;
				textures.push(texture);
			}
		};
		const schedule = () => {
			idleId =
				'requestIdleCallback' in window
					? requestIdleCallback(start, { timeout: 2000 })
					: setTimeout(start, 300);
		};
		if (document.readyState === 'complete') schedule();
		else window.addEventListener('load', schedule, { once: true });

		return () => {
			destroyed = true;
			clearTimeout(newRecordTimer);
			window.removeEventListener('load', schedule);
			if ('cancelIdleCallback' in window) cancelIdleCallback(idleId);
			clearTimeout(idleId);
			cleanup?.();
		};
	});

	const VERTEX = /* glsl */ `
		attribute vec3 aFaceNormal;
		attribute float aSeed;
		uniform float uBurst;
		varying vec3 vViewPosition;
		void main() {
			// Chaque facette s'écarte le long de sa normale, d'une distance propre à elle
			vec3 p = position + aFaceNormal * uBurst * (0.5 + aSeed);
			vec4 mv = modelViewMatrix * vec4(p, 1.0);
			vViewPosition = -mv.xyz;
			gl_Position = projectionMatrix * mv;
		}
	`;

	const FRAGMENT = /* glsl */ `
		uniform sampler2D uMatA;
		uniform sampler2D uMatB;
		uniform float uMix;
		uniform vec2 uLight;
		varying vec3 vViewPosition;
		void main() {
			// Normale de la facette (flat shading) calculée à partir des dérivées écran
			vec3 n = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
			// Déplacer la lumière = faire pivoter la normale avant de lire la matcap
			float cx = cos(uLight.y), sx = sin(uLight.y);
			float cy = cos(uLight.x), sy = sin(uLight.x);
			n = vec3(n.x, cx * n.y - sx * n.z, sx * n.y + cx * n.z);
			n = vec3(cy * n.x + sy * n.z, n.y, -sy * n.x + cy * n.z);
			vec2 uv = n.xy * 0.495 + 0.5;
			vec3 color = mix(texture2D(uMatA, uv).rgb, texture2D(uMatB, uv).rgb, uMix);
			gl_FragColor = vec4(color, 1.0);
			#include <colorspace_fragment>
		}
	`;

	function init(THREE, textures, onReady) {
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		textures[0].colorSpace = THREE.SRGBColorSpace;

		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		container.appendChild(renderer.domElement);

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
		camera.position.set(0, 0, 7);

		// Détail 16 : ~5 800 facettes. La géométrie n'est pas indexée : chaque facette a ses
		// 3 sommets, ce qui permet de l'écarter indépendamment des autres.
		// Rayon 1,35 : la sphère occupe ~72 % du cadre, ce qui laisse de la marge aux textes
		const RADIUS = 1.35;
		const geometry = new THREE.IcosahedronGeometry(RADIUS, 16);
		const pos = geometry.attributes.position;
		const faceNormals = new Float32Array(pos.count * 3);
		const seeds = new Float32Array(pos.count);
		const c = new THREE.Vector3();
		for (let i = 0; i < pos.count; i += 3) {
			// Direction du centre de la facette = sa normale (la sphère est centrée en 0)
			c.set(
				pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2),
				pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2),
				pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)
			).normalize();
			const seed = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
			for (let k = 0; k < 3; k++) {
				faceNormals.set([c.x, c.y, c.z], (i + k) * 3);
				seeds[i + k] = seed;
			}
		}
		geometry.setAttribute('aFaceNormal', new THREE.BufferAttribute(faceNormals, 3));
		geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

		const uniforms = {
			uMatA: { value: textures[0] },
			uMatB: { value: textures[0] },
			uMix: { value: 0 },
			uLight: { value: new THREE.Vector2() },
			uBurst: { value: 0 }
		};
		const material = new THREE.ShaderMaterial({
			vertexShader: VERTEX,
			fragmentShader: FRAGMENT,
			uniforms,
			side: THREE.DoubleSide // quand les facettes s'écartent, on voit l'intérieur
		});
		const sphere = new THREE.Mesh(geometry, material);

		// Le groupe porte la légère parallaxe souris, la sphère porte la rotation libre
		const tilt = new THREE.Group();
		tilt.add(sphere);
		scene.add(tilt);

		const resize = () => {
			const { clientWidth: w, clientHeight: h } = container;
			renderer.setSize(w, h, false);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
		};
		const ro = new ResizeObserver(resize);
		ro.observe(container);
		resize();

		const canvas = renderer.domElement;

		// --- Lumière qui suit la souris (ou l'inclinaison du téléphone) ---
		let targetX = 0;
		let targetY = 0;
		const lightTarget = new THREE.Vector2();
		// ±0,35 rad (~20°) : assez pour voir le reflet glisser, sans noyer la sphère de lumière
		const clampLight = (v) => Math.max(-0.55, Math.min(0.55, v));
		const onWindowPointer = (e) => {
			targetX = (e.clientX / window.innerWidth - 0.5) * 0.4;
			targetY = (e.clientY / window.innerHeight - 0.5) * 0.25;
			const rect = canvas.getBoundingClientRect();
			const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
			const dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
			lightTarget.set(clampLight(-dx * 0.6), clampLight(-dy * 0.6));
		};
		window.addEventListener('pointermove', onWindowPointer);

		let orientationOn = false;
		const onOrientation = (e) => {
			if (e.gamma == null || e.beta == null) return;
			// gamma : gauche/droite, beta : avant/arrière (téléphone tenu vers 45°)
			lightTarget.set(clampLight((-e.gamma / 30) * 0.35), clampLight(((e.beta - 45) / 30) * 0.35));
		};
		const enableOrientation = async () => {
			if (orientationOn || !('DeviceOrientationEvent' in window)) return;
			orientationOn = true;
			try {
				// iOS demande l'autorisation, et seulement suite à un geste de l'utilisateur
				if (typeof DeviceOrientationEvent.requestPermission === 'function') {
					if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') return;
				}
				window.addEventListener('deviceorientation', onOrientation);
			} catch {
				// refusé ou indisponible : la lumière reste pilotée au doigt
			}
		};

		// --- Matières : un clic passe à la suivante, avec un fondu ---
		let fading = false;
		const nextMaterial = () => {
			const next = (materialIndex + 1) % MATERIALS.length;
			const texture = textures[next];
			if (!texture || fading) return; // pas encore chargée : on ignore ce clic
			uniforms.uMatB.value = texture;
			uniforms.uMix.value = 0;
			fading = true;
			materialIndex = next;
			burstImpulse = Math.max(burstImpulse, 0.05); // petit "pop" au changement
		};

		// --- Attraper / lancer ---
		// Vitesse angulaire en rad/s autour des axes X et Y du monde. Au repos elle
		// revient vers une rotation lente (idle) par un lerp indépendant du framerate.
		const IDLE = reduceMotion ? 0 : 0.12;
		const DAMPING = 1.1; // plus c'est bas, plus le ralenti est long
		const MAX_SPEED = 48; // ~7,6 tours/s : de la marge pour enchaîner les lancers
		const DRAG_SPEED = 0.008; // radians par pixel glissé
		// velocity : l'élan de la sphère, qui persiste d'un geste à l'autre.
		// gesture : la vitesse du geste en cours, ajoutée à l'élan au relâchement.
		// Deux gestes dans le même sens s'additionnent ; un geste contraire freine.
		const velocity = { x: 0, y: IDLE };
		const gesture = { x: 0, y: 0 };
		let dragging = false;
		let lastX = 0;
		let lastY = 0;
		let lastT = 0;
		let downX = 0;
		let downY = 0;
		let downT = 0;
		let scale = 1;
		let burst = 0;
		let burstImpulse = 0;
		let best = record;

		const raycaster = new THREE.Raycaster();
		const ndc = new THREE.Vector2();
		const hitsSphere = (e) => {
			const rect = canvas.getBoundingClientRect();
			ndc.set(
				((e.clientX - rect.left) / rect.width) * 2 - 1,
				-((e.clientY - rect.top) / rect.height) * 2 + 1
			);
			raycaster.setFromCamera(ndc, camera);
			return raycaster.intersectObject(sphere).length > 0;
		};

		const qx = new THREE.Quaternion();
		const qy = new THREE.Quaternion();
		const AXIS_X = new THREE.Vector3(1, 0, 0);
		const AXIS_Y = new THREE.Vector3(0, 1, 0);
		const rotateBy = (ax, ay) => {
			qx.setFromAxisAngle(AXIS_X, ax);
			qy.setFromAxisAngle(AXIS_Y, ay);
			sphere.quaternion.premultiply(qy).premultiply(qx);
		};

		const onDown = (e) => {
			if (!hitsSphere(e)) return;
			if (e.pointerType === 'touch') enableOrientation();
			dragging = true;
			hinted = true;
			lastX = downX = e.clientX;
			lastY = downY = e.clientY;
			lastT = downT = performance.now();
			gesture.x = gesture.y = 0; // l'élan est conservé : on peut relancer une sphère qui tourne
			canvas.setPointerCapture(e.pointerId);
			canvas.style.cursor = 'grabbing';
		};
		const onMove = (e) => {
			if (!dragging) {
				canvas.style.cursor = hitsSphere(e) ? 'grab' : '';
				return;
			}
			const now = performance.now();
			const dt = Math.max((now - lastT) / 1000, 1 / 240);
			const ay = (e.clientX - lastX) * DRAG_SPEED;
			const ax = (e.clientY - lastY) * DRAG_SPEED;
			rotateBy(ax, ay);
			// Vitesse du geste lissée, pour que le lancer suive le mouvement réel
			const k = Math.min(1, dt * 20);
			gesture.x += (ax / dt - gesture.x) * k;
			gesture.y += (ay / dt - gesture.y) * k;
			lastX = e.clientX;
			lastY = e.clientY;
			lastT = now;
		};
		const onUp = (e) => {
			if (!dragging) return;
			dragging = false;
			const now = performance.now();
			const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
			if (moved < 6 && now - downT < 350) {
				// Un clic, pas un lancer : on change de matière, la sphère garde son élan
				nextMaterial();
			} else if (now - lastT < 80) {
				// Lancer : le geste s'ajoute à l'élan (même sens = plus vite, sens contraire = frein)
				velocity.x += gesture.x;
				velocity.y += gesture.y;
			}
			// Relâchée sans bouger depuis un moment : rien à ajouter (tenue, elle a déjà freiné)
			const speed = Math.hypot(velocity.x, velocity.y);
			if (speed > MAX_SPEED) {
				velocity.x *= MAX_SPEED / speed;
				velocity.y *= MAX_SPEED / speed;
			}
			if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
			canvas.style.cursor = hitsSphere(e) ? 'grab' : '';
		};
		canvas.addEventListener('pointerdown', onDown);
		canvas.addEventListener('pointermove', onMove);
		canvas.addEventListener('pointerup', onUp);
		canvas.addEventListener('pointercancel', onUp);

		// Ne pas rendre quand le hero est hors écran
		let visible = true;
		const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
		io.observe(container);

		const saveRecord = () => {
			try {
				localStorage.setItem(RECORD_KEY, String(best));
			} catch {
				// pas de stockage : tant pis, le record vit le temps de la visite
			}
		};

		// Chronomètre natif (THREE.Clock est obsolète depuis Three.js r168)
		let lastFrame = performance.now();
		let frame;
		const tick = () => {
			frame = requestAnimationFrame(tick);
			const now = performance.now();
			const dt = Math.min((now - lastFrame) / 1000, 1 / 20);
			lastFrame = now;
			if (!visible) return;
			const ease = (rate) => 1 - Math.exp(-rate * dt);

			if (dragging) {
				// Sous le doigt, la sphère continue sur son élan ; tenue immobile, elle freine
				if (performance.now() - lastT > 80) {
					const brake = ease(5);
					velocity.x -= velocity.x * brake;
					velocity.y -= velocity.y * brake;
				}
				rotateBy(velocity.x * dt, velocity.y * dt);
			}
			if (!dragging) {
				// Lerp exponentiel vers la rotation de repos : ralenti smooth
				const t = ease(DAMPING);
				velocity.x += (0 - velocity.x) * t;
				velocity.y += (IDLE - velocity.y) * t;
				rotateBy(velocity.x * dt, velocity.y * dt);

				// Record : vitesse de rotation en tours par seconde, au dixième près
				const turns = Math.floor((Math.hypot(velocity.x, velocity.y) / (2 * Math.PI)) * 10) / 10;
				if (turns !== liveSpeed) liveSpeed = turns; // vitesse affichée en direct
				if (turns >= 0.5 && turns > best) {
					best = turns;
					record = turns;
					newRecord = true;
					clearTimeout(newRecordTimer);
					newRecordTimer = setTimeout(() => ((newRecord = false), saveRecord()), 1400);
				}
			}

			// Facettes : elles s'écartent avec la vitesse, et se remettent en place en douceur
			const speed = Math.hypot(velocity.x, velocity.y);
			// Seuil de 2 rad/s : au repos (rotation lente) les facettes restent jointives
			const burstTarget =
				Math.min(0.16, (Math.max(0, speed - 2) / MAX_SPEED) * 0.22) + burstImpulse;
			burst += (burstTarget - burst) * ease(burstTarget > burst ? 10 : 3);
			burstImpulse *= 1 - ease(6);
			uniforms.uBurst.value = reduceMotion ? 0 : burst;

			// Fondu entre deux matières
			if (fading) {
				uniforms.uMix.value = Math.min(1, uniforms.uMix.value + dt / 0.6);
				if (uniforms.uMix.value >= 1) {
					uniforms.uMatA.value = uniforms.uMatB.value;
					uniforms.uMix.value = 0;
					fading = false;
				}
			}

			// Lumière : suit la cible (souris ou gyroscope) avec un lerp
			uniforms.uLight.value.lerp(lightTarget, ease(4));

			// Petit écrasement quand on la tient
			scale += ((dragging ? 0.95 : 1) - scale) * ease(12);
			// Les facettes s'écartent jusqu'à 1,5 × uBurst : on réduit l'échelle d'autant pour
			// que la sphère éclatée garde la même taille extérieure (pas de débordement)
			sphere.scale.setScalar((scale * RADIUS) / (RADIUS + 1.5 * uniforms.uBurst.value));

			tilt.rotation.y += (targetX - tilt.rotation.y) * 0.05;
			tilt.rotation.x += (targetY - tilt.rotation.x) * 0.05;
			renderer.render(scene, camera);
		};
		// Shaders compilés en parallèle (KHR_parallel_shader_compile) avant le premier
		// rendu : la compilation ne bloque pas le fil principal
		let alive = true;
		renderer
			.compileAsync(scene, camera)
			.catch(() => {})
			.then(() => {
				if (!alive) return;
				tick();
				onReady();
			});

		return () => {
			alive = false;
			cancelAnimationFrame(frame);
			window.removeEventListener('pointermove', onWindowPointer);
			window.removeEventListener('deviceorientation', onOrientation);
			canvas.removeEventListener('pointerdown', onDown);
			canvas.removeEventListener('pointermove', onMove);
			canvas.removeEventListener('pointerup', onUp);
			canvas.removeEventListener('pointercancel', onUp);
			ro.disconnect();
			io.disconnect();
			geometry.dispose();
			textures.forEach((t) => t.dispose());
			material.dispose();
			renderer.dispose();
			renderer.domElement.remove();
		};
	}
</script>

<div bind:this={container} class="sphere" class:ready aria-hidden="true">
	<p class="caption" class:visible={ready}>
		{#if !hinted}
			{labels.hint}
		{:else}
			<span>{labels.materials[materialIndex]}</span>
			<span class="line">
				<span class="speed">
					{labels.speed}
					<b>{nf.format(liveSpeed)}</b>
					{labels.turnsPerSecond}
				</span>
				{#if record > 0}
					<span class="sep">·</span>
					<span class="record" class:new={newRecord}>
						{newRecord ? labels.newRecord : labels.record}
						<b>{nf.format(record)}</b>
					</span>
				{/if}
			</span>
		{/if}
	</p>
</div>

<style>
	.sphere {
		position: relative;
		width: 100%;
		height: 100%;
	}
	/* Halo émissif : la sphère semble éclairer ce qui l'entoure */
	.sphere::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		width: 110%;
		aspect-ratio: 1;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		/* dégradé seul, sans filtre de flou : même douceur, bien moins coûteux */
		background: radial-gradient(
			circle,
			rgb(224 190 120 / 0.3) 0%,
			rgb(201 162 74 / 0.14) 40%,
			rgb(201 162 74 / 0.05) 58%,
			transparent 72%
		);
		will-change: transform, opacity;
		opacity: 0;
		transition: opacity 1.6s ease;
		pointer-events: none;
	}
	.sphere.ready::before {
		opacity: 1;
		animation: breathe 6s ease-in-out infinite;
	}
	/* transform et opacité seulement : animés par le GPU, sans repeindre */
	@keyframes breathe {
		50% {
			transform: translate(-50%, -50%) scale(1.07);
			opacity: 0.8;
		}
	}
	.sphere :global(canvas) {
		position: relative;
		opacity: 0;
		transition: opacity 1.2s ease;
		display: block;
		width: 100%;
		height: 100%;
		/* le scroll vertical reste possible sur mobile, le glissé horizontal fait tourner */
		touch-action: pan-y;
	}
	.sphere.ready :global(canvas) {
		opacity: 1;
	}
	.caption {
		position: absolute;
		left: 50%;
		bottom: 2%;
		margin: 0;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		align-items: center;
		font-size: 0.7rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #c9a24a;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.6s ease;
	}
	.caption.visible {
		opacity: 0.8;
	}
	.line {
		display: flex;
		gap: 0.5rem;
		align-items: baseline;
	}
	.sep {
		opacity: 0.5;
	}
	.speed b {
		display: inline-block;
		min-width: 2.2em; /* le chiffre change sans faire bouger le reste de la ligne */
		text-align: center;
		font-weight: 600;
		letter-spacing: 0.05em;
		font-variant-numeric: tabular-nums;
	}
	.record b {
		font-weight: 600;
		letter-spacing: 0.05em;
	}
	.record {
		display: inline-block;
		transition:
			color 0.3s ease,
			transform 0.3s ease;
	}
	.record.new {
		color: #f3dfae;
		transform: scale(1.08);
	}
	@media (prefers-reduced-motion: reduce) {
		.sphere.ready::before {
			animation: none;
		}
		.record.new {
			transform: none;
		}
	}
</style>
