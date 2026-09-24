<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import '@fontsource-variable/nunito';
	import Sphere from '$lib/portfolio/Sphere.svelte';
	import { content, contact, clients } from '$lib/portfolio/data.js';

	// La langue vient de l'URL (?lang=en) : rendue côté serveur, partageable, sans JS requis
	const lang = $derived(page.url.searchParams.get('lang') === 'en' ? 'en' : 'fr');
	const t = $derived(content[lang]);
	const otherLang = $derived(lang === 'fr' ? 'en' : 'fr');
	const fullName = `${contact.firstName} ${contact.lastName}`;

	const sections = $derived([
		{ id: 'accueil', label: t.ui.nav.home },
		{ id: 'projets', label: t.ui.nav.projects },
		{ id: 'parcours', label: t.ui.nav.journey },
		{ id: 'contact', label: t.ui.nav.contact }
	]);
	let active = $state('accueil');

	// Formulaire de contact : envoi réel via /contact
	let form = $state({ name: '', email: '', message: '', website: '' });
	let status = $state('idle'); // idle | sending | sent | error

	async function send(e) {
		e.preventDefault();
		status = 'sending';
		try {
			const res = await fetch('/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			if (!res.ok) throw new Error(String(res.status));
			status = 'sent';
			form = { name: '', email: '', message: '', website: '' };
		} catch {
			status = 'error';
		}
	}

	// Vidéos de projet : lecture seulement quand elles sont à l'écran (rien n'est téléchargé
	// avant), pause quand on s'en éloigne. Avec « animations réduites », contrôles manuels.
	function playInView(node) {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			node.controls = true;
			return;
		}
		const io = new IntersectionObserver(
			([entry]) => (entry.isIntersecting ? node.play().catch(() => {}) : node.pause()),
			{ threshold: 0.35 }
		);
		io.observe(node);
		return { destroy: () => io.disconnect() };
	}

	// Projet à plusieurs vidéos : index de la vidéo affichée, par projet
	let activeVideo = $state({});

	// Visionneuse plein écran pour les schémas
	let lightbox = $state(null);
	let lightboxEl;
	function openFigure(project) {
		lightbox = project;
		lightboxEl.showModal();
	}

	// Frise du parcours : la barre se remplit à mesure que le milieu de l'écran la parcourt,
	// et chaque étape s'allume quand la barre l'atteint
	function timelineProgress(node) {
		let frame;
		const update = () => {
			frame = null;
			const rect = node.getBoundingClientRect();
			const mid = window.innerHeight * 0.55;
			const progress = Math.min(1, Math.max(0, (mid - rect.top) / rect.height));
			node.style.setProperty('--progress', progress.toFixed(4));
			for (const li of node.children) {
				li.classList.toggle('reached', li.getBoundingClientRect().top + 8 <= mid);
			}
		};
		const schedule = () => (frame ??= requestAnimationFrame(update));
		window.addEventListener('scroll', schedule, { passive: true });
		window.addEventListener('resize', schedule);
		update();
		return {
			destroy() {
				window.removeEventListener('scroll', schedule);
				window.removeEventListener('resize', schedule);
				if (frame) cancelAnimationFrame(frame);
			}
		};
	}

	// Apparition douce des blocs au scroll
	function reveal(node) {
		node.classList.add('rv');
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					node.classList.add('in');
					io.disconnect();
				}
			},
			{ threshold: 0.15 }
		);
		io.observe(node);
		return { destroy: () => io.disconnect() };
	}

	onMount(() => {
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) if (entry.isIntersecting) active = entry.target.id;
			},
			{ rootMargin: '-45% 0px -50% 0px' }
		);
		['accueil', 'projets', 'parcours', 'contact'].forEach((id) =>
			io.observe(document.getElementById(id))
		);
		return () => io.disconnect();
	});

	// Suit la langue quand on bascule sans rechargement
	$effect(() => {
		document.documentElement.lang = lang;
	});
</script>

<svelte:head>
	<title>{fullName} — {t.profile.title}</title>
	<meta
		name="description"
		content="{t.profile.title} · {t.profile.disciplines.join(', ')}. {t.profile.tagline}"
	/>
	<link rel="canonical" href="{page.url.origin}/{lang === 'en' ? '?lang=en' : ''}" />
	<link rel="alternate" hreflang="fr" href="{page.url.origin}/" />
	<link rel="alternate" hreflang="en" href="{page.url.origin}/?lang=en" />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content={t.meta.locale} />
	<meta property="og:title" content="{fullName} — {t.profile.title}" />
	<meta property="og:description" content={t.profile.tagline} />
	<meta property="og:url" content="{page.url.origin}/{lang === 'en' ? '?lang=en' : ''}" />
	<meta property="og:image" content="{page.url.origin}/media/og-{lang}.jpg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#121213" />
	<link rel="icon" type="image/svg+xml" href="/media/favicon.svg" />
	<link rel="apple-touch-icon" href="/media/apple-touch-icon.png" />
</svelte:head>

<div class="pf">
	<nav class="top" aria-label="Navigation">
		<a href="#accueil" class="mono" title={t.ui.nav.home}>VB</a>
		<ul>
			{#each sections.slice(1) as s}
				<li><a href="#{s.id}" class:current={active === s.id}>{s.label}</a></li>
			{/each}
			<li>
				<a
					class="lang"
					href={otherLang === 'en' ? '?lang=en' : '?'}
					hreflang={otherLang}
					lang={otherLang}
					data-sveltekit-noscroll
					data-sveltekit-replacestate
					title={t.ui.switchTo}>{otherLang.toUpperCase()}</a
				>
			</li>
		</ul>
	</nav>

	<!-- Pagination latérale 01 02 03 04 -->
	<aside class="rail" aria-hidden="true">
		{#each sections as s, i}
			<a href="#{s.id}" class:current={active === s.id} tabindex="-1">
				<span>{String(i + 1).padStart(2, '0')}</span><i></i>
			</a>
		{/each}
	</aside>

	<!-- ============ HERO ============ -->
	<header id="accueil" class="hero">
		<div class="hero-art">
			<Sphere labels={t.ui.sphere} />
		</div>

		<div class="hero-copy">
			<p class="available">
				<span class="dot" aria-hidden="true"></span>
				{t.profile.availability} · {t.profile.availabilityPlaces}
			</p>
			<p class="kicker">{t.profile.title} · {t.profile.disciplines.join(' · ')}</p>
			<h1>
				<span class="fill">{contact.firstName}</span>
				<span class="outline">{contact.lastName}</span>
			</h1>
			<p class="tagline">{t.profile.tagline}</p>
			<div class="ctas">
				<a class="btn primary" href="#projets"
					>{t.ui.ctaProjects} <span aria-hidden="true">→</span></a
				>
				<a class="btn ghost" href="#contact">{t.ui.ctaContact}</a>
			</div>
		</div>

		<a class="scroll" href="#projets" aria-label={t.ui.scrollLabel}><span></span></a>
	</header>

	<section class="stats" use:reveal>
		{#each t.stats as s}
			<div>
				<strong>{s.value}</strong>
				<span>{s.label}</span>
			</div>
		{/each}
	</section>

	<section class="clients" aria-label={t.ui.clientsLabel}>
		<p class="label">{t.ui.clientsLabel}</p>
		<div class="marquee">
			<div class="track">
				{#each [...clients, ...clients] as c, i}
					<span aria-hidden={i >= clients.length}>{c}</span>
				{/each}
			</div>
		</div>
	</section>

	<!-- ============ PROJETS ============ -->
	<section id="projets" class="projects">
		<h2 class="giant centered" use:reveal>{t.ui.projectsTitle}</h2>

		{#each t.projects as p, i (p.id)}
			{@const videos =
				p.media.videos ?? (p.media.video ? [{ src: p.media.video, poster: p.media.poster }] : [])}
			{@const current = videos[activeVideo[p.id] ?? 0]}
			<article class="project" id="projet-{p.id}">
				<div class="project-head" use:reveal>
					<span class="num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
					<div>
						<p class="meta">{p.year} · {p.tags.join(' · ')}</p>
						<h3>{p.name} <em>— {p.title}</em></h3>
						<p class="summary">{p.summary}</p>
					</div>
				</div>

				<div class="project-body">
					<div class="media-col">
						<div class="window" class:phone={p.media.frame === 'phone'} use:reveal>
							{#if p.media.frame !== 'phone'}
								<div class="chrome" aria-hidden="true">
									<i></i><i></i><i></i>
									<span>{p.name.toLowerCase().replace(/\s+/g, '-')}</span>
								</div>
							{/if}
							<div class="screen" style:aspect-ratio={p.media.aspect ?? '16 / 9'}>
								{#if current}
									{#key current.src}
										<video
											src={current.src}
											poster={current.poster}
											muted
											loop
											playsinline
											preload="none"
											aria-label="{p.name} — {p.videoLabels?.[activeVideo[p.id] ?? 0] ?? p.title}"
											use:playInView
										></video>
									{/key}
								{:else if p.media.poster}
									<img src={p.media.poster} alt="{p.name} — {p.title}" loading="lazy" />
								{:else}
									<div class="placeholder">
										<span class="play" aria-hidden="true"></span>
										<p>{t.ui.videoSoon}</p>
									</div>
								{/if}
							</div>
						</div>

						{#if videos.length > 1}
							<div class="video-tabs" role="group" aria-label={p.name}>
								{#each videos as video, k (video.src)}
									<button
										type="button"
										aria-pressed={(activeVideo[p.id] ?? 0) === k}
										onclick={() => (activeVideo[p.id] = k)}
									>
										{p.videoLabels?.[k] ?? k + 1}
									</button>
								{/each}
							</div>
						{/if}

						{#if p.figure}
							<button type="button" class="figure-card" use:reveal onclick={() => openFigure(p)}>
								<img
									src={p.figure.src}
									alt=""
									width={p.figure.width}
									height={p.figure.height}
									loading="lazy"
								/>
								<span class="figure-text">
									<span class="label">{p.figureLabel ?? t.ui.dataModel}</span>
									<span class="figure-caption">{p.figureCaption}</span>
									<span class="figure-more">{t.ui.enlarge} ↗</span>
								</span>
							</button>
						{/if}
					</div>

					<div class="details" use:reveal>
						<div class="detail">
							<h4 class="label">{t.ui.context}</h4>
							<p>{p.context}</p>
						</div>
						<div class="detail">
							<h4 class="label">{t.ui.work}</h4>
							<ul>
								{#each p.work as point}
									<li>{point}</li>
								{/each}
							</ul>
						</div>
						<div class="detail">
							<h4 class="label">{t.ui.result}</h4>
							<p>{p.result}</p>
						</div>
						<ul class="stack">
							{#each p.stack as tech}
								<li>{tech}</li>
							{/each}
						</ul>
					</div>
				</div>
			</article>
		{/each}
	</section>

	<!-- ============ PARCOURS ============ -->
	<section id="parcours" class="story">
		<div class="story-head" use:reveal>
			<h2 class="giant">{t.ui.journeyTitle}</h2>
			<div class="story-text">
				<p class="lead">{t.journey.intro}</p>
				<p>{t.journey.body}</p>
			</div>
			<span class="ghost-type" aria-hidden="true">WEB/3D</span>
		</div>

		<div class="journey">
			<figure class="portrait" use:reveal>
				<picture>
					<source srcset={contact.photo} type="image/webp" />
					<img
						src="/media/valentin.jpg"
						alt={t.ui.photoAlt}
						width="800"
						height="960"
						loading="lazy"
						decoding="async"
					/>
				</picture>
			</figure>

			<ol class="timeline" use:timelineProgress>
				{#each t.journey.timeline as item}
					<li use:reveal>
						<p class="label">{item.period}</p>
						<h3 class="role">{item.role}</h3>
						<p class="place">{item.place}</p>
						<p class="desc">{item.text}</p>
					</li>
				{/each}
			</ol>
		</div>

		<div class="skills-block">
			<h3 class="label skills-title" use:reveal>{t.ui.skillsTitle}</h3>
			<div class="skills">
				{#each t.journey.skills as s}
					<div class="skill" use:reveal>
						<h4>{s.group}</h4>
						<p>{s.text}</p>
						<ul class="stack">
							{#each s.items as item}
								<li>{item}</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ============ CONTACT ============ -->
	<section id="contact" class="contact">
		<h2 class="giant" use:reveal>{t.ui.contactTitle}</h2>
		<div class="contact-grid">
			<div use:reveal>
				<p class="lead">{t.ui.contactLead}</p>
				<a class="mail" href="mailto:{contact.email}">{contact.email}</a>
				<ul class="links">
					<li>
						<span class="label">{t.ui.phone}</span><a href="tel:{contact.phone.replace(/\s/g, '')}"
							>{contact.phone}</a
						>
					</li>
					<li>
						<span class="label">LinkedIn</span><a
							href={contact.linkedin}
							target="_blank"
							rel="noopener">valentin-boutouria ↗</a
						>
					</li>
					<li><span class="label">{t.ui.basedIn}</span><span>{t.profile.location}</span></li>
					<li>
						<span class="label">{t.ui.availabilityLabel}</span><span
							>{t.profile.availability}<br />{t.profile.availabilityPlaces}</span
						>
					</li>
				</ul>
			</div>

			<form class="card form" use:reveal onsubmit={send}>
				<p class="label">{t.ui.form.title}</p>
				<label>
					<span>{t.ui.form.name}</span>
					<input bind:value={form.name} autocomplete="name" maxlength="120" required />
				</label>
				<label>
					<span>{t.ui.form.email}</span>
					<input
						type="email"
						bind:value={form.email}
						autocomplete="email"
						maxlength="200"
						required
					/>
				</label>
				<label>
					<span>{t.ui.form.message}</span>
					<textarea bind:value={form.message} rows="5" maxlength="5000" required></textarea>
				</label>
				<!-- piège à bots, invisible pour les humains -->
				<input
					class="trap"
					bind:value={form.website}
					name="website"
					tabindex="-1"
					autocomplete="off"
					aria-hidden="true"
				/>
				<button class="btn primary" type="submit" disabled={status === 'sending'}>
					{status === 'sending' ? t.ui.form.sending : t.ui.form.send}
					<span aria-hidden="true">→</span>
				</button>
				<p class="form-status" role="status" aria-live="polite">
					{#if status === 'sent'}
						{t.ui.form.sent}
					{:else if status === 'error'}
						{t.ui.form.error} <a href="mailto:{contact.email}">{contact.email}</a>.
					{/if}
				</p>
			</form>
		</div>
	</section>

	<dialog
		class="lightbox"
		bind:this={lightboxEl}
		onclick={(e) => e.target === lightboxEl && lightboxEl.close()}
	>
		{#if lightbox}
			<figure>
				<picture>
					<source srcset={lightbox.figure.src} type="image/webp" />
					<img
						src={lightbox.figure.fallback}
						alt={lightbox.figureCaption}
						width={lightbox.figure.width}
						height={lightbox.figure.height}
					/>
				</picture>
				<figcaption>{lightbox.figureCaption}</figcaption>
			</figure>
			<button type="button" class="lightbox-close" onclick={() => lightboxEl.close()}>
				{t.ui.close} ✕
			</button>
		{/if}
	</dialog>

	<footer>
		<span>© {new Date().getFullYear()} {fullName}</span>
		<p class="lh">
			<span class="lh-label">{t.ui.lighthouse.label}</span>
			{#each t.ui.lighthouse.scores as [name, score]}
				<span class="lh-score"><b>{score}</b> {name}</span>
			{/each}
		</p>
		<a href="#accueil">{t.ui.backToTop}</a>
	</footer>
</div>

<style>
	.pf {
		--bg: #121213;
		--bg-2: #19191b;
		--ink: #f1ede4;
		--muted: #a19d95;
		--gold: #c9a24a;
		--gold-soft: #e0c07a;
		--line: rgb(201 162 74 / 0.16);
		--gutter: clamp(1rem, 5vw, 5rem);

		position: relative;
		overflow-x: clip;
		min-height: 100vh;
		background:
			repeating-linear-gradient(
				90deg,
				transparent 0 calc(25% - 1px),
				rgb(255 255 255 / 0.025) calc(25% - 1px) 25%
			),
			var(--bg);
		color: var(--ink);
		font-family: 'Nunito Variable', 'Nunito', system-ui, sans-serif;
		font-weight: 300;
		-webkit-font-smoothing: antialiased;
	}
	:global(html) {
		scroll-behavior: smooth;
	}
	.pf a {
		color: inherit;
		text-decoration: none;
	}
	.pf :global(.label) {
		font-size: 0.7rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		font-weight: 400;
		color: var(--gold);
		margin: 0;
	}
	.pf :global(.rv) {
		opacity: 0;
		transform: translateY(24px);
		transition:
			opacity 0.9s ease,
			transform 0.9s cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.pf :global(.rv.in) {
		opacity: 1;
		transform: none;
	}

	/* ---------- Nav ---------- */
	.top {
		position: fixed;
		inset: 0 0 auto 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.4rem var(--gutter);
		background: linear-gradient(var(--bg) 55%, rgb(18 18 19 / 0));
	}
	.mono {
		font-size: 0.95rem;
		letter-spacing: 0.3em;
		color: var(--gold);
		font-weight: 500;
	}
	.top ul {
		display: flex;
		gap: 0.75rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	/* Liens en pilule dorée : un remplissage or glisse de gauche à droite au survol */
	.top a:not(.mono) {
		position: relative;
		display: block;
		overflow: hidden;
		isolation: isolate;
		padding: 0.65rem 1.4rem;
		border: 1px solid rgb(201 162 74 / 0.45);
		border-radius: 999px;
		background: rgb(18 18 19 / 0.6);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		color: var(--ink);
		font-size: 0.95rem;
		letter-spacing: 0.04em;
		transition:
			color 0.35s ease,
			border-color 0.35s ease,
			box-shadow 0.35s ease,
			transform 0.35s ease;
	}
	.top a:not(.mono)::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		background: var(--gold);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.top a:not(.mono):hover,
	.top a:not(.mono):focus-visible {
		color: #17140d;
		border-color: var(--gold);
		box-shadow: 0 0 24px rgb(201 162 74 / 0.35);
		transform: translateY(-2px);
	}
	.top a:not(.mono):hover::before,
	.top a:not(.mono):focus-visible::before {
		transform: scaleX(1);
	}
	.top a.current {
		color: var(--gold);
		border-color: var(--gold);
		background: rgb(201 162 74 / 0.12);
	}

	.rail {
		position: fixed;
		left: var(--gutter);
		bottom: 2rem;
		z-index: 40;
		display: flex;
		gap: 0.9rem;
		font-size: 0.7rem;
		letter-spacing: 0.1em;
	}
	.rail a {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--muted);
	}
	.rail i {
		display: block;
		width: 0;
		height: 1px;
		background: var(--gold);
		transition: width 0.5s ease;
	}
	.rail a.current {
		color: var(--gold);
	}
	.rail a.current i {
		width: 3.5rem;
	}

	/* ---------- Hero ---------- */
	.hero {
		position: relative;
		min-height: 100svh;
		display: grid;
		grid-template-columns: 1.1fr 1fr;
		align-items: center;
		padding: 6rem var(--gutter) 5rem;
	}
	.hero-copy {
		position: relative;
		z-index: 2;
		grid-row: 1;
		grid-column: 1;
	}
	.hero-art {
		position: relative;
		grid-row: 1;
		grid-column: 2;
		aspect-ratio: 1;
		width: 100%;
		max-width: 44rem;
		justify-self: end;
	}
	/* Pastille de disponibilité, avec un point qui pulse doucement */
	.available {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		margin: 0 0 1.4rem;
		padding: 0.45rem 1rem 0.45rem 0.8rem;
		border: 1px solid rgb(201 162 74 / 0.45);
		border-radius: 999px;
		background: rgb(201 162 74 / 0.08);
		color: var(--ink);
		font-size: 0.85rem;
	}
	.dot {
		position: relative;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--gold);
	}
	.dot::after {
		content: '';
		position: absolute;
		inset: -4px;
		border-radius: 50%;
		border: 1px solid var(--gold);
		animation: ping 2.4s ease-out infinite;
	}
	@keyframes ping {
		from {
			transform: scale(0.6);
			opacity: 0.9;
		}
		to {
			transform: scale(1.8);
			opacity: 0;
		}
	}
	.kicker {
		margin: 0 0 1.5rem;
		font-size: 0.78rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--muted);
	}
	h1 {
		margin: 0;
		font-weight: 300;
		line-height: 0.92;
		font-size: clamp(3.4rem, 11vw, 10rem);
		letter-spacing: -0.02em;
		white-space: nowrap;
	}
	h1 span {
		display: block;
	}
	.fill {
		color: var(--gold);
	}
	.outline,
	.ghost-type {
		color: transparent;
		-webkit-text-stroke: 1px var(--gold);
	}
	.tagline {
		max-width: 32rem;
		margin: 2rem 0 0;
		font-size: clamp(1.05rem, 1.6vw, 1.25rem);
		line-height: 1.6;
		color: var(--muted);
	}
	.ctas {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 2.5rem;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.9rem 1.5rem;
		border-radius: 0.5rem;
		font: inherit;
		font-size: 0.9rem;
		font-weight: 400;
		cursor: pointer;
		border: 1px solid var(--gold);
		transition:
			background 0.3s,
			color 0.3s,
			box-shadow 0.3s;
	}
	.btn.primary {
		background: var(--gold);
		color: #17140d !important;
	}
	.btn.primary:hover {
		background: var(--gold-soft);
		box-shadow: 0 0 30px rgb(201 162 74 / 0.35);
	}
	.btn.ghost {
		color: var(--gold) !important;
		background: transparent;
	}
	.btn.ghost:hover {
		background: rgb(201 162 74 / 0.1);
	}
	.btn:focus-visible,
	.pf a:focus-visible,
	.pf input:focus-visible,
	.pf textarea:focus-visible {
		outline: 1px solid var(--gold-soft);
		outline-offset: 3px;
	}
	.scroll {
		position: absolute;
		right: var(--gutter);
		bottom: 2rem;
		width: 1px;
		height: 4rem;
		background: rgb(201 162 74 / 0.25);
		overflow: hidden;
	}
	.scroll span {
		position: absolute;
		inset: 0;
		background: var(--gold);
		animation: drip 2.2s ease-in-out infinite;
	}
	@keyframes drip {
		from {
			transform: translateY(-100%);
		}
		to {
			transform: translateY(100%);
		}
	}

	/* ---------- Stats & clients ---------- */
	.stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		margin: 0 var(--gutter);
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
	}
	.stats div {
		padding: 2.2rem 1.5rem 2.2rem 0;
	}
	.stats div + div {
		padding-left: 1.5rem;
		border-left: 1px solid var(--line);
	}
	.stats strong {
		display: block;
		font-size: clamp(2rem, 4vw, 3.2rem);
		font-weight: 300;
		color: var(--gold);
	}
	.stats span {
		display: block;
		margin-top: 0.4rem;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.clients {
		padding: 3rem 0 0;
	}
	.clients .label {
		padding: 0 var(--gutter);
		margin-bottom: 1.2rem;
	}
	.marquee {
		overflow: hidden;
		mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
	}
	.track {
		display: flex;
		width: max-content;
		gap: 3.5rem;
		animation: slide 40s linear infinite;
		font-size: clamp(1.3rem, 2.4vw, 2rem);
		color: rgb(241 237 228 / 0.55);
	}
	.track span::after {
		content: '✦';
		margin-left: 3.5rem;
		font-size: 0.6em;
		color: var(--gold);
		vertical-align: middle;
	}
	@keyframes slide {
		to {
			transform: translateX(-50%);
		}
	}

	/* ---------- Titres géants ---------- */
	.giant {
		margin: 0;
		font-weight: 300;
		font-size: clamp(4rem, 13vw, 11rem);
		line-height: 1;
		color: var(--gold);
		letter-spacing: -0.01em;
	}
	.centered {
		text-align: center;
	}

	/* ---------- Projets ---------- */
	.projects {
		padding: 8rem var(--gutter) 2rem;
	}
	.project {
		max-width: 64rem;
		margin: 0 auto;
		padding: 6rem 0;
		border-bottom: 1px solid var(--line);
	}
	.project:last-child {
		border-bottom: 0;
	}
	.project-head {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: clamp(1rem, 3vw, 2.5rem);
		margin-bottom: 3rem;
	}
	.num {
		font-size: clamp(3rem, 6vw, 5rem);
		line-height: 0.9;
		color: transparent;
		-webkit-text-stroke: 1px var(--gold);
	}
	.meta {
		margin: 0 0 0.6rem;
		font-size: 0.75rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--muted);
	}
	h3 {
		margin: 0;
		font-size: clamp(1.8rem, 3.6vw, 2.8rem);
		font-weight: 400;
		line-height: 1.1;
	}
	h3 em {
		font-style: normal;
		font-weight: 300;
		color: var(--gold);
	}
	.summary {
		max-width: 40rem;
		margin: 1rem 0 0;
		line-height: 1.65;
		color: var(--muted);
	}

	.project-body {
		display: grid;
		grid-template-columns: 1.3fr 1fr;
		gap: clamp(2rem, 4vw, 3.5rem);
		align-items: start;
	}
	/* Colonne média : vidéo + schéma, qui restent visibles pendant la lecture du texte */
	.media-col {
		position: sticky;
		top: 6rem;
		display: grid;
		gap: 1rem;
	}
	.window {
		border-radius: 1rem;
		overflow: hidden;
		border: 1px solid var(--line);
		background: var(--bg-2);
		box-shadow: 0 40px 80px -30px rgb(0 0 0 / 0.9);
	}
	/* Variante téléphone, pour les captures en portrait */
	.window.phone {
		width: min(100%, 19rem);
		justify-self: center;
		padding: 0.55rem;
		border-radius: 2.4rem;
		border: 1px solid rgb(201 162 74 / 0.35);
		background: linear-gradient(160deg, #26262a, #141415);
		box-shadow:
			0 40px 80px -30px rgb(0 0 0 / 0.9),
			inset 0 0 0 1px rgb(255 255 255 / 0.04);
	}
	.window.phone .screen {
		border-radius: 1.9rem;
		overflow: hidden;
		background: #000;
	}
	.chrome {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.8rem 1rem;
		border-bottom: 1px solid var(--line);
	}
	.chrome i {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #ff5f57;
	}
	.chrome i:nth-child(2) {
		background: #febc2e;
	}
	.chrome i:nth-child(3) {
		background: #28c840;
	}
	.chrome span {
		flex: 1;
		max-width: 22rem;
		margin-left: 1rem;
		padding: 0.25rem 0.8rem;
		border-radius: 0.4rem;
		background: rgb(255 255 255 / 0.04);
		font-size: 0.72rem;
		color: var(--muted);
	}
	.screen {
		aspect-ratio: 16 / 9;
	}
	.screen video,
	.screen img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.placeholder {
		height: 100%;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 1rem;
		background:
			radial-gradient(60% 70% at 50% 50%, rgb(201 162 74 / 0.08), transparent),
			repeating-linear-gradient(0deg, transparent 0 39px, rgb(201 162 74 / 0.05) 39px 40px),
			repeating-linear-gradient(90deg, transparent 0 39px, rgb(201 162 74 / 0.05) 39px 40px);
	}
	.placeholder p {
		margin: 0;
		font-size: 0.75rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.play {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		border: 1px solid var(--gold);
		position: relative;
	}
	.play::after {
		content: '';
		position: absolute;
		left: 54%;
		top: 50%;
		transform: translate(-50%, -50%);
		border-left: 12px solid var(--gold);
		border-top: 8px solid transparent;
		border-bottom: 8px solid transparent;
	}

	/* Sélecteur de vidéo, dans le style du sélecteur de période du dashboard */
	.video-tabs {
		justify-self: center;
		display: inline-flex;
		gap: 2px;
		padding: 3px;
		border: 1px solid var(--line);
		border-radius: 999px;
	}
	.video-tabs button {
		padding: 0.4rem 1rem;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		transition:
			background 0.2s,
			color 0.2s;
	}
	.video-tabs button:hover {
		color: var(--ink);
	}
	.video-tabs button[aria-pressed='true'] {
		background: var(--gold);
		color: #17140d;
		font-weight: 600;
	}
	.figure-card {
		display: grid;
		grid-template-columns: 9rem 1fr;
		gap: 1rem;
		align-items: center;
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--line);
		border-radius: 1rem;
		background: var(--bg-2);
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: zoom-in;
		transition:
			border-color 0.3s,
			transform 0.3s;
	}
	.figure-card:hover,
	.figure-card:focus-visible {
		border-color: rgb(201 162 74 / 0.5);
		transform: translateY(-2px);
	}
	.figure-card img {
		width: 100%;
		height: auto;
		border-radius: 0.5rem;
		display: block;
	}
	.figure-text {
		display: grid;
		gap: 0.35rem;
	}
	.figure-caption {
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--muted);
	}
	.figure-more {
		font-size: 0.8rem;
		color: var(--gold);
	}
	.lightbox {
		/* le reset CSS global met margin: 0 partout ; margin: auto recentre le dialog modal */
		margin: auto;
		width: min(72rem, calc(100vw - 2rem));
		max-height: calc(100dvh - 2rem);
		padding: 1rem;
		border: 1px solid var(--line);
		border-radius: 1rem;
		background: var(--bg-2);
		color: var(--ink);
	}
	.lightbox::backdrop {
		background: rgb(0 0 0 / 0.8);
		backdrop-filter: blur(4px);
	}
	.lightbox figure {
		margin: 0;
	}
	.lightbox img {
		display: block;
		width: 100%;
		height: auto;
		max-height: calc(100dvh - 9rem);
		object-fit: contain;
		border-radius: 0.5rem;
	}
	.lightbox figcaption {
		margin-top: 0.75rem;
		font-size: 0.9rem;
		color: var(--muted);
	}
	.lightbox-close {
		position: absolute;
		top: 1.5rem;
		right: 1.5rem;
		padding: 0.4rem 0.9rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: rgb(18 18 19 / 0.85);
		color: var(--ink);
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
	}
	.lightbox-close:hover {
		border-color: var(--gold);
		color: var(--gold);
	}
	.details {
		display: grid;
		gap: 1.6rem;
	}
	.detail {
		padding-top: 1.1rem;
		border-top: 1px solid var(--line);
	}
	.detail:first-child {
		padding-top: 0;
		border-top: 0;
	}
	.detail p:not(.label),
	.detail ul {
		margin: 0.6rem 0 0;
		line-height: 1.65;
		color: var(--muted);
		font-size: 0.95rem;
	}
	.detail ul {
		list-style: none;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}
	.detail li {
		position: relative;
		padding-left: 1.1rem;
	}
	.detail li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.65em;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--gold);
	}
	.stack {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.stack li {
		padding: 0.4rem 0.9rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		font-size: 0.8rem;
		color: var(--muted);
	}

	/* ---------- Story ---------- */
	.story {
		padding: 8rem var(--gutter);
		background: linear-gradient(180deg, var(--bg), #0e0e0f 40%, var(--bg));
	}
	.story-head {
		position: relative;
		max-width: 64rem;
		margin: 0 auto;
		display: grid;
		gap: 2rem;
	}
	/* Le titre au-dessus, la présentation dessous : accroche à gauche, détail à droite */
	.story-text {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem clamp(2rem, 5vw, 4rem);
		align-items: start;
	}
	.story-text .lead {
		margin: 0;
	}
	.story-text p:not(.lead) {
		margin: 0;
	}
	.lead {
		margin: 0 0 1.2rem;
		font-size: clamp(1.15rem, 1.8vw, 1.4rem);
		line-height: 1.55;
		color: var(--ink);
	}
	.story-text p:not(.lead) {
		line-height: 1.7;
		color: var(--muted);
	}
	.ghost-type {
		grid-column: 1 / -1;
		font-size: clamp(4rem, 17vw, 14rem);
		line-height: 0.85;
		font-weight: 500;
		letter-spacing: 0.05em;
		opacity: 0.35;
		user-select: none;
	}

	.journey {
		max-width: 64rem;
		margin: 4rem auto 0;
		display: grid;
		grid-template-columns: minmax(14rem, 20rem) 1fr;
		gap: clamp(2rem, 5vw, 4.5rem);
		align-items: start;
	}
	.portrait {
		position: relative;
		margin: 0;
	}
	.portrait::after {
		content: '';
		position: absolute;
		inset: 0.9rem -0.9rem -0.9rem 0.9rem;
		z-index: 0;
		border: 1px solid var(--gold);
		border-radius: 1rem;
		opacity: 0.6;
	}
	.portrait img {
		position: relative;
		z-index: 1;
		display: block;
		width: 100%;
		height: auto;
		border-radius: 1rem;
		filter: saturate(0.85) contrast(1.02);
	}
	.timeline {
		position: relative;
		margin: 0;
		padding: 0 0 0 2.5rem;
		list-style: none;
		display: grid;
		gap: 2.5rem;
	}
	/* Rail discret + remplissage or piloté par le scroll (--progress, de 0 à 1) */
	.timeline::before,
	.timeline::after {
		content: '';
		position: absolute;
		left: 0.45rem;
		top: 0.5rem;
		width: 1.5px;
	}
	.timeline::before {
		bottom: 0.5rem;
		background: rgb(201 162 74 / 0.15);
	}
	.timeline::after {
		height: calc((100% - 1rem) * var(--progress, 0));
		background: linear-gradient(var(--gold-soft), var(--gold));
		box-shadow: 0 0 10px rgb(201 162 74 / 0.7);
	}
	.timeline li {
		position: relative;
	}
	.timeline li::before {
		content: '';
		position: absolute;
		left: calc(-2.5rem + 0.2rem);
		top: 0.25rem;
		z-index: 1;
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--bg);
		border: 1.5px solid rgb(201 162 74 / 0.4);
		transition:
			background 0.4s ease,
			border-color 0.4s ease,
			box-shadow 0.4s ease,
			transform 0.4s ease;
	}
	/* Pastille atteinte par la barre : elle s'allume */
	/* :global : la classe est posée par JavaScript, Svelte retirerait sinon la règle */
	.timeline li:global(.reached)::before {
		background: var(--gold);
		border-color: var(--gold);
		box-shadow: 0 0 12px var(--gold);
		transform: scale(1.15);
	}
	.timeline .role {
		margin: 0.5rem 0 0.2rem;
		font-size: 1.4rem;
		font-weight: 400;
	}
	.place {
		margin: 0;
		color: var(--gold-soft);
		font-size: 0.9rem;
	}
	.desc {
		max-width: 42rem;
		margin: 0.6rem 0 0;
		line-height: 1.65;
		color: var(--muted);
	}

	.skills-block {
		max-width: 64rem;
		margin: 7rem auto 0;
	}
	/* L'espace est porté par la grille : la règle globale .label remet la marge du titre à 0 */
	.skills-block .skills {
		margin-top: 2.5rem;
	}
	.skills {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}
	.skill {
		padding: 1.75rem;
		border-radius: 1rem;
		border: 1px solid var(--line);
		background: linear-gradient(180deg, #1a1a1c, #141415);
	}
	.skill h4 {
		margin: 0;
		font-size: 1.3rem;
		font-weight: 600;
		color: var(--gold);
	}
	.skill p {
		margin: 0.5rem 0 1.25rem;
		line-height: 1.6;
		color: var(--muted);
		font-size: 0.95rem;
	}

	/* ---------- Contact ---------- */
	.contact {
		padding: 8rem var(--gutter) 6rem;
	}
	.contact-grid {
		max-width: 64rem;
		margin: 3rem auto 0;
		display: grid;
		grid-template-columns: 1.1fr 1fr;
		gap: clamp(2rem, 6vw, 5rem);
		align-items: start;
	}
	.mail {
		display: inline-block;
		margin: 1rem 0 2.5rem;
		font-size: clamp(1.3rem, 3vw, 2.2rem);
		color: var(--gold) !important;
		border-bottom: 1px solid var(--line);
		padding-bottom: 0.3rem;
		word-break: break-all;
		transition: border-color 0.3s;
	}
	.mail:hover {
		border-color: var(--gold);
	}
	.links {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1.1rem;
	}
	.links li {
		display: grid;
		grid-template-columns: 7.5rem 1fr;
		align-items: baseline;
		color: var(--ink);
	}
	.links a:hover {
		color: var(--gold);
	}
	.card {
		padding: 1.75rem;
		border-radius: 1rem;
		border: 1px solid var(--line);
		background: linear-gradient(180deg, #1c1c1e, #141415);
	}
	.form {
		display: grid;
		gap: 1.2rem;
	}
	.form label {
		display: grid;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.form input,
	.form textarea {
		width: 100%;
		padding: 0.8rem 1rem;
		border-radius: 0.5rem;
		border: 1px solid var(--line);
		background: rgb(0 0 0 / 0.3);
		color: var(--ink);
		font: inherit;
		resize: vertical;
	}
	.form input:focus,
	.form textarea:focus {
		border-color: var(--gold);
		box-shadow: none;
	}
	.form .btn {
		justify-self: start;
	}
	.form .btn:disabled {
		opacity: 0.6;
		cursor: wait;
	}
	.trap {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		opacity: 0;
	}
	.form-status {
		min-height: 1.5em;
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--gold-soft);
	}
	.form-status a {
		text-decoration: underline;
	}

	footer {
		display: flex;
		justify-content: space-between;
		padding: 2rem var(--gutter) 5rem;
		border-top: 1px solid var(--line);
		font-size: 0.8rem;
		color: var(--muted);
	}
	footer {
		flex-wrap: wrap;
		gap: 1rem 2rem;
		align-items: center;
	}
	.lh {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
		margin: 0;
	}
	.lh-label {
		letter-spacing: 0.12em;
		text-transform: uppercase;
		font-size: 0.7rem;
	}
	.lh-score b {
		display: inline-grid;
		place-items: center;
		width: 2.1rem;
		height: 2.1rem;
		margin-right: 0.3rem;
		border: 1.5px solid var(--gold);
		border-radius: 50%;
		color: var(--gold);
		font-weight: 600;
		font-size: 0.75rem;
	}
	footer a:hover {
		color: var(--gold);
	}

	/* ---------- Responsive ---------- */
	@media (max-width: 900px) {
		.hero {
			grid-template-columns: 1fr;
			align-content: center;
			padding-top: 5rem;
		}
		/* Sur mobile : le nom, le texte et les boutons d'abord, la sphère en dessous */
		.hero-copy {
			grid-row: 1;
		}
		.hero-art {
			grid-row: 2;
			grid-column: 1;
			width: min(100%, 26rem);
			justify-self: center;
			margin-top: 2rem;
		}
		.stats {
			grid-template-columns: 1fr 1fr;
		}
		.stats div:nth-child(3) {
			border-left: 0;
			padding-left: 0;
		}
		.stats div:nth-child(n + 3) {
			border-top: 1px solid var(--line);
		}
		.story-head,
		.contact-grid,
		.project-body,
		.skills {
			grid-template-columns: 1fr;
		}
		.story-text {
			grid-template-columns: 1fr;
		}
		.journey {
			grid-template-columns: 1fr;
		}
		.portrait {
			max-width: 18rem;
		}
		.outline {
			-webkit-text-stroke-width: 1.5px;
		}
		.media-col {
			position: static;
		}
		.rail {
			display: none;
		}
	}
	@media (max-width: 520px) {
		.outline {
			-webkit-text-stroke-width: 1.8px;
		}
		.kicker {
			font-size: 0.7rem;
			letter-spacing: 0.16em;
		}
		.top ul {
			gap: 0.4rem;
		}
		.top a:not(.mono) {
			padding: 0.5rem 0.85rem;
			font-size: 0.85rem;
		}
		.project-head {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
		.links li {
			grid-template-columns: 1fr;
			gap: 0.2rem;
		}
		footer {
			padding-bottom: 2rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(html) {
			scroll-behavior: auto;
		}
		.track,
		.scroll span,
		.dot::after {
			animation: none;
		}
		.top a:not(.mono),
		.top a:not(.mono)::before {
			transition: none;
		}
		.pf :global(.rv) {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>
