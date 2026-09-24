// Contenu du portfolio, en français et en anglais. Tout le texte du site vit ici
// pour pouvoir l'éditer sans toucher à la mise en page.
//
// Médias : chaque projet a un champ `media`. Tant que `video` et `poster` sont
// à null, la fenêtre affiche un emplacement "Vidéo à venir". Déposer les fichiers
// dans static/media/ puis renseigner par ex. video: '/media/honda.mp4'.

export const languages = ['fr', 'en'];

export const contact = {
	firstName: 'Valentin',
	lastName: 'Boutouria',
	email: 'v.boutouria159@gmail.com',
	phone: '+33 6 95 21 75 93',
	linkedin: 'https://www.linkedin.com/in/valentin-boutouria',
	photo: '/media/valentin.webp'
};

export const clients = [
	'Apple',
	'Snapchat',
	'Orange',
	'Samsung',
	'Honda',
	'Givenchy',
	'Marc Jacobs',
	'Servier',
	'Fondation Louis Vuitton',
	'Musée du Louvre'
];

// Ce qui ne dépend pas de la langue
const projectBase = {
	honda: {
		name: 'Honda',
		year: '2026',
		stack: ['SvelteKit', 'JavaScript', 'Three.js', 'Supabase', 'GTM', 'Cloudflare'],
		// Capture de téléphone en portrait : affichée dans un cadre de téléphone
		media: {
			video: '/media/honda.mp4',
			poster: '/media/honda-poster.jpg',
			aspect: '540 / 1170',
			frame: 'phone'
		}
	},
	dashboard: {
		name: 'Atomic Data',
		year: '2026',
		stack: ['Vue 3', 'TypeScript', 'Supabase', 'PostgreSQL', 'Tailwind CSS', 'Vitest'],
		media: {
			video: '/media/dashboard.mp4',
			poster: '/media/dashboard-poster.jpg',
			aspect: '16 / 10'
		},
		figure: {
			src: '/media/dashboard-bdd.webp',
			fallback: '/media/dashboard-bdd.png',
			width: 1606,
			height: 1194
		}
	},
	incidents: {
		name: 'Incident Tracker',
		year: '2026',
		stack: ['Angular 18', 'TypeScript', 'Java 21', 'Spring Boot', 'Docker', 'GitHub Actions'],
		media: {
			video: '/media/incidents.mp4',
			poster: '/media/incidents-poster.jpg',
			aspect: '16 / 10'
		}
	},
	lvdream: {
		name: 'Louis Vuitton',
		year: '2026',
		stack: ['Lens Studio', 'JavaScript', 'Image tracking', 'Shaders', 'UX mobile'],
		// Plusieurs Lenses : un sélecteur sous le téléphone passe de l'une à l'autre
		media: {
			videos: [
				{ src: '/media/lv-milano.mp4', poster: '/media/lv-milano-poster.jpg' },
				{ src: '/media/lv-3gen.mp4', poster: '/media/lv-3gen-poster.jpg' }
			],
			aspect: '540 / 1170',
			frame: 'phone'
		},
		figure: {
			src: '/media/lv-snap.webp',
			fallback: '/media/lv-snap.png',
			width: 900,
			height: 1490
		}
	}
};

const withBase = (projects) => projects.map((p) => ({ ...projectBase[p.id], ...p }));

const fr = {
	meta: { locale: 'fr_FR' },
	ui: {
		nav: { projects: 'Projets', journey: 'Parcours', contact: 'Contact', home: 'Accueil' },
		switchTo: 'English',
		ctaProjects: 'Voir les projets',
		ctaContact: 'Me contacter',
		clientsLabel: 'Marques sur lesquelles j’ai travaillé',
		projectsTitle: 'Projets',
		videoSoon: 'Vidéo à venir',
		context: 'Contexte',
		work: 'Tâches réalisées',
		result: 'Résultat',
		dataModel: 'Modèle de données',
		enlarge: 'Agrandir',
		close: 'Fermer',
		journeyTitle: 'Parcours',
		skillsTitle: 'Compétences',
		photoAlt: 'Portrait de Valentin Boutouria',
		contactTitle: 'Contact',
		contactLead: 'Un poste, un projet web exigeant, une idée à prototyper ? Écrivez-moi.',
		phone: 'Téléphone',
		basedIn: 'Basé à',
		availabilityLabel: 'Disponibilité',
		form: {
			title: 'Message',
			name: 'Votre nom',
			email: 'Votre email',
			message: 'Votre message',
			send: 'Envoyer',
			sending: 'Envoi…',
			sent: 'Merci, votre message est bien parti. Je vous réponds vite.',
			error: 'L’envoi a échoué. Vous pouvez m’écrire directement à'
		},
		sphere: {
			locale: 'fr-FR',
			hint: 'Lance-la · clique pour changer de matière',
			materials: ['Or', 'Verre fumé'],
			speed: 'Vitesse',
			record: 'Record',
			newRecord: 'Nouveau record !',
			turnsPerSecond: 'tours/s'
		},
		backToTop: 'Haut de page ↑',
		scrollLabel: 'Défiler vers les projets'
	},
	profile: {
		title: 'Ingénieur logiciel full-stack',
		disciplines: ['Interfaces web', 'Performance', '3D temps réel'],
		tagline:
			'Je transforme des maquettes en interfaces web fluides, responsives et rapides, avec le souci du détail visuel. Et quand elle sert l’expérience, j’y ajoute de la 3D.',
		location: 'Paris',
		availability: 'Disponible en CDI dès mars 2027',
		availabilityPlaces: 'Paris · Montpellier · Valence'
	},
	stats: [
		{ value: '+50', label: 'projets livrés en production en studio créatif' },
		{ value: '10', label: 'marques internationales, d’Apple au Musée du Louvre' },
		{ value: '2 ans', label: 'en studio, avec des équipes en Europe et aux États-Unis' },
		{ value: 'FR / EN', label: 'bilingue, anglais courant (TOEIC 945)' }
	],
	projects: withBase([
		{
			id: 'dashboard',
			title: 'Dashboard analytics full‑stack', // tiret insécable : jamais coupé en fin de ligne
			figureCaption:
				'Schéma Supabase : les visiteurs, les miroirs et les projets, reliés par clés étrangères.',
			tags: ['Full-stack', 'Vue.js', 'Supabase'],
			summary:
				'De la base de données à l’écran : les miroirs AR du studio enregistrent chaque visite, et un tableau de bord modulable en Vue 3 permet aux clients de suivre la fréquentation de leurs activations.',
			context:
				'Chaque activation (miroirs AR, lenses) produisait ses propres chiffres ; il fallait une interface unique, lisible par un client non technique, et assez souple pour s’adapter à chaque projet.',
			work: [
				'Back-end : base Supabase / PostgreSQL en 3 tables (projets, miroirs, visiteurs) reliées par clés étrangères, alimentée par les miroirs à chaque visite',
				'Jobs cron de purge automatique des données collectées',
				'Front Vue 3 et TypeScript : grille modulable de widgets chiffre (1×2), graphique (4×2) et camembert (2×2), ajoutés depuis un catalogue extensible et réorganisés au glisser-déposer',
				'Graphiques en SVG faits main, utilisables au clavier et lisibles par les lecteurs d’écran',
				'Requêtes par comptages agrégés, sans rapatrier de données personnelles, et 50 tests unitaires Vitest'
			],
			result:
				'Une chaîne complète, de la visite devant le miroir au chiffre sur l’écran du client, avec un dashboard que chacun compose à sa façon.'
		},
		{
			id: 'honda',
			title: 'Jeu concours web, mobile-first',
			tags: ['Full-stack', 'Web 3D', 'Campagne'],
			summary:
				'Le site d’un jeu concours Honda : une landing en 3D, un parcours de création, un formulaire d’inscription et un jeu en réalité augmentée, le tout pensé pour le téléphone.',
			context:
				'Le parcours devait fonctionner sur tous les smartphones, charger vite, respecter l’identité visuelle de la marque et le plan de taggage de l’annonceur.',
			work: [
				'Intégration des écrans de la campagne en SvelteKit, mobile-first, avec les polices et la charte Honda',
				'Formulaire d’inscription validé côté client et serveur, protégé par reCAPTCHA, enregistré dans Supabase',
				'Scène 3D Three.js optimisée (modèle compressé Draco, éclairage HDR) et révélation animée sur canvas',
				'Tracking GTM / dataLayer (clics CTA, formulaire, profondeur de scroll) derrière le consentement OneTrust'
			],
			result:
				'Un seul front qui enchaîne landing, création, révélation vidéo, inscription et jeu AR, déployé sur Cloudflare.'
		},
		{
			id: 'incidents',
			title: 'Application Angular + API',
			tags: ['Full-stack', 'DevOps', 'Tests'],
			summary:
				'Une application de gestion d’incidents complète, du formulaire côté front jusqu’à l’API, la base et l’intégration continue.',
			context:
				'Un objectif organisationnel : donner aux équipes une vue claire des incidents en cours (sévérité, statut, responsable) pour mieux prioriser, anticiper la charge et planifier les interventions.',
			work: [
				'Front Angular 18 en TypeScript : standalone components, formulaires réactifs avec validation',
				'Tests front Jasmine / Karma, tests back JUnit 5 et Mockito, couverture JaCoCo',
				'API REST Spring Boot (Java 21) avec erreurs normalisées, base PostgreSQL versionnée par Flyway',
				'Images Docker multi-stage, Docker Compose et pipeline GitHub Actions (build, tests, images)'
			],
			result:
				'docker compose up --build suffit : le front, l’API et une base pré-remplie démarrent ensemble.'
		},
		{
			id: 'lvdream',
			title: 'Lenses AR pour l’exposition LV Dream',
			tags: ['Réalité augmentée', 'Snapchat Lens', 'Luxe'],
			summary:
				'Une série de Lenses Snapchat pour l’espace d’exposition LV Dream : le visiteur scanne une malle, un portrait ou une vitrine, et l’histoire de la Maison s’anime sur son téléphone.',
			videoLabels: ['Malle Milano', 'Trois générations'],
			figureLabel: 'Visuel',
			figureCaption: 'Visuel de la Lens « Milano » : la malle et ses points d’intérêt.',
			context:
				'Prolonger la visite dans le téléphone, sans application à installer : chaque objet exposé devait pouvoir raconter son histoire en quelques gestes.',
			work: [
				'Malle « Milano » : scan de la malle, puis des points d’intérêt sur chaque accessoire, qui ouvrent leur fiche (ouvre-gants, brosse, cahier-séchoir…)',
				'Trois générations : scan des portraits de Louis, Georges et Gaston-Louis Vuitton, qui révèlent chacun un chapitre de l’histoire de la Maison',
				'Vitrines Art Déco : suivi de marqueur et occlusion par shaders, pour que la 3D passe derrière le décor réel',
				'Parcours guidé commun : tutoriel, indices contextuels, interactions au tap et textes localisés'
			],
			result:
				'Des expériences qui s’ouvrent en un scan depuis Snapchat, pensées pour rester fluides sur la plus large gamme de téléphones.'
		}
	]),
	journey: {
		intro:
			'Ingénieur ISIMA, je développe depuis 2024 des interfaces web et mobiles en studio créatif, pour des marques où le rendu visuel compte autant que la technique.',
		body: 'Mon quotidien : prendre en charge un besoin de bout en bout. Je conçois la base de données et l’API, je développe l’interface, puis je livre en production, du dashboard qui suit la fréquentation de nos miroirs AR au jeu concours Honda déployé sur Cloudflare. Je travaille avec les designers, les chefs de projet et les clients, en Europe comme aux États-Unis, avec la même exigence sur la qualité du code que sur le rendu. Et quand un projet le demande, ma formation en 3D temps réel prend le relais : scènes Three.js, Lenses en réalité augmentée pour Louis Vuitton.',
		timeline: [
			{
				period: 'Sept. 2024 — Aujourd’hui',
				role: 'Ingénieur logiciel full-stack',
				place: 'Atomic Digital Design · Paris',
				text: 'Sites de campagne, applications web et mobiles, miroirs en réalité augmentée, pour Apple, Orange, Samsung, Honda, Givenchy… En SCRUM, avec revues de code, aux côtés d’équipes et de clients en Europe et aux États-Unis.'
			},
			{
				period: 'Janv. — Août 2024',
				role: 'Ingénieur stagiaire',
				place: 'University College Dublin · Irlande',
				text: 'Application Unity pour la recherche en interaction homme-machine : stabilité, performances et ergonomie. En environnement 100 % anglophone.'
			},
			{
				period: 'Formation',
				role: 'Diplôme d’ingénieur en informatique',
				place: 'ISIMA · Clermont Auvergne INP',
				text: 'Spécialité informatique embarquée, réalité virtuelle et systèmes interactifs. Après une CPGE PSI.'
			}
		],
		skills: [
			{
				group: 'Front-end',
				text: 'Des maquettes intégrées en interfaces responsives, rapides et cohérentes.',
				items: [
					'HTML5 / CSS3',
					'JavaScript ES6+',
					'TypeScript',
					'SvelteKit',
					'Angular',
					'Tailwind CSS',
					'Vite'
				]
			},
			{
				group: 'Back-end & données',
				text: 'Des API et des bases de données conçues de bout en bout : modélisation, requêtes, automatisation et déploiement.',
				items: ['Node.js', 'API REST', 'PostgreSQL', 'Supabase', 'Docker', 'Cloudflare']
			},
			{
				group: 'Qualité & performance',
				text: 'Des interfaces responsives, accessibles et légères, relues en revue de code à chaque livraison.',
				items: ['Responsive', 'Mobile-first', 'Optimisation', 'Tests', 'Tracking GTM']
			},
			{
				group: '3D & interactif',
				text: 'Le petit plus : des interfaces animées et des scènes 3D qui restent légères.',
				items: ['Three.js', 'WebGL', 'Unity', 'Lens Studio']
			}
		]
	}
};

const en = {
	meta: { locale: 'en_US' },
	ui: {
		nav: { projects: 'Work', journey: 'Journey', contact: 'Contact', home: 'Home' },
		switchTo: 'Français',
		ctaProjects: 'See my work',
		ctaContact: 'Get in touch',
		clientsLabel: 'Brands I’ve worked on',
		projectsTitle: 'Work',
		videoSoon: 'Video coming soon',
		context: 'Context',
		work: 'Key tasks',
		result: 'Outcome',
		dataModel: 'Data model',
		enlarge: 'Enlarge',
		close: 'Close',
		journeyTitle: 'Journey',
		skillsTitle: 'Skills',
		photoAlt: 'Portrait of Valentin Boutouria',
		contactTitle: 'Contact',
		contactLead: 'A role, a demanding web project, an idea to prototype? Drop me a line.',
		phone: 'Phone',
		basedIn: 'Based in',
		availabilityLabel: 'Availability',
		form: {
			title: 'Message',
			name: 'Your name',
			email: 'Your email',
			message: 'Your message',
			send: 'Send',
			sending: 'Sending…',
			sent: 'Thanks, your message is on its way. I’ll get back to you soon.',
			error: 'Sending failed. You can email me directly at'
		},
		sphere: {
			locale: 'en-US',
			hint: 'Throw it · click to change material',
			materials: ['Gold', 'Smoked glass'],
			speed: 'Speed',
			record: 'Record',
			newRecord: 'New record!',
			turnsPerSecond: 'turns/s'
		},
		backToTop: 'Back to top ↑',
		scrollLabel: 'Scroll to projects'
	},
	profile: {
		title: 'Full-stack software engineer',
		disciplines: ['Web interfaces', 'Performance', 'Real-time 3D'],
		tagline:
			'I turn designs into smooth, responsive, fast web interfaces, with an eye for visual detail. And when it serves the experience, I add some 3D.',
		location: 'Paris',
		availability: 'Open to a permanent role from March 2027',
		availabilityPlaces: 'Paris · Montpellier · Valence'
	},
	stats: [
		{ value: '50+', label: 'projects shipped to production at a creative studio' },
		{ value: '10', label: 'international brands, from Apple to the Louvre' },
		{ value: '2 yrs', label: 'at a studio, with teams in Europe and the US' },
		{ value: 'FR / EN', label: 'bilingual, fluent English (TOEIC 945)' }
	],
	projects: withBase([
		{
			id: 'dashboard',
			title: 'Full‑stack analytics dashboard',
			figureCaption: 'Supabase schema: visitors, mirrors and projects, linked by foreign keys.',
			tags: ['Full-stack', 'Vue.js', 'Supabase'],
			summary:
				'From database to screen: the studio’s AR mirrors record every visit, and a modular Vue 3 dashboard lets clients track attendance at their activations.',
			context:
				'Each activation (AR mirrors, lenses) produced its own numbers; clients needed one clear interface, readable without a technical background and flexible enough for every project.',
			work: [
				'Back end: Supabase / PostgreSQL database with 3 tables (projects, mirrors, visitors) linked by foreign keys, fed by the mirrors on every visit',
				'Cron jobs that automatically purge collected data',
				'Vue 3 and TypeScript front end: a modular grid of number (1×2), chart (4×2) and pie (2×2) widgets, added from an extensible catalog and rearranged by drag and drop',
				'Hand-made SVG charts, usable with the keyboard and readable by screen readers',
				'Aggregated count queries, with no personal data pulled into the browser, plus 50 Vitest unit tests'
			],
			result:
				'A complete pipeline, from a visit in front of the mirror to a number on the client’s screen, with a dashboard everyone arranges their own way.'
		},
		{
			id: 'honda',
			title: 'Mobile-first contest website',
			tags: ['Full-stack', 'Web 3D', 'Campaign'],
			summary:
				'The website for a Honda contest: a 3D landing page, a creation flow, a sign-up form and an augmented reality game, all designed for phones.',
			context:
				'The flow had to work on every smartphone, load fast, match the brand’s visual identity and follow the advertiser’s tagging plan to the letter.',
			work: [
				'Built the campaign screens in SvelteKit, mobile-first, with Honda’s fonts and brand guidelines',
				'Sign-up form validated on client and server, protected by reCAPTCHA, stored in Supabase',
				'Optimized Three.js 3D scene (Draco-compressed model, HDR lighting) and an animated canvas reveal',
				'GTM / dataLayer tracking (CTA clicks, form, scroll depth) behind OneTrust consent'
			],
			result:
				'A single front end chaining landing, creation, video reveal, sign-up and AR game, deployed on Cloudflare.'
		},
		{
			id: 'incidents',
			title: 'Angular app + API',
			tags: ['Full-stack', 'DevOps', 'Testing'],
			summary:
				'A complete incident management app, from the front-end form to the API, the database and continuous integration.',
			context:
				'An organizational goal: give teams a clear view of ongoing incidents (severity, status, owner) so they can prioritize better, anticipate workload and plan their interventions.',
			work: [
				'Angular 18 front end in TypeScript: standalone components, reactive forms with validation',
				'Front-end tests with Jasmine / Karma, back-end tests with JUnit 5 and Mockito, JaCoCo coverage',
				'Spring Boot REST API (Java 21) with standardized errors, PostgreSQL schema versioned by Flyway',
				'Multi-stage Docker images, Docker Compose and a GitHub Actions pipeline (build, tests, images)'
			],
			result:
				'docker compose up --build is all it takes: the front end, the API and a seeded database start together.'
		},
		{
			id: 'lvdream',
			title: 'AR Lenses for the LV Dream exhibition',
			tags: ['Augmented reality', 'Snapchat Lens', 'Luxury'],
			summary:
				'A series of Snapchat Lenses for the LV Dream exhibition space: visitors scan a trunk, a portrait or a display window, and the Maison’s story comes to life on their phone.',
			videoLabels: ['Milano trunk', 'Three generations'],
			figureLabel: 'Key visual',
			figureCaption: 'Key visual of the “Milano” Lens: the trunk and its points of interest.',
			context:
				'Extend the visit into the phone, with no app to install: every exhibited object had to tell its story in just a few gestures.',
			work: [
				'“Milano” trunk: scan the trunk, then points of interest on each accessory open their own card (glove stretcher, brush, blotting book…)',
				'Three generations: scan the portraits of Louis, Georges and Gaston-Louis Vuitton, each revealing a chapter of the Maison’s history',
				'Art Deco windows: marker tracking and shader-based occlusion, so the 3D slips behind the real scenery',
				'Shared guided flow: tutorial, contextual hints, tap interactions and localized text'
			],
			result:
				'Experiences that open with a single scan from Snapchat, built to stay smooth on the widest range of phones.'
		}
	]),
	journey: {
		intro:
			'An ISIMA-trained engineer, I have been building web and mobile interfaces at a creative studio since 2024, for brands where visual quality matters as much as the tech.',
		body: 'My day to day: owning a need from end to end. I design the database and the API, build the interface, then ship to production, from the dashboard tracking attendance at our AR mirrors to the Honda contest deployed on Cloudflare. I work with designers, project managers and clients, in Europe and the US, holding the code to the same standard as the visuals. And when a project calls for it, my background in real-time 3D takes over: Three.js scenes, augmented reality Lenses for Louis Vuitton.',
		timeline: [
			{
				period: 'Sept. 2024 — Today',
				role: 'Full-stack software engineer',
				place: 'Atomic Digital Design · Paris',
				text: 'Campaign websites, web and mobile apps, augmented reality mirrors, for Apple, Orange, Samsung, Honda, Givenchy… Working in SCRUM with code reviews, alongside teams and clients in Europe and the US.'
			},
			{
				period: 'Jan. — Aug. 2024',
				role: 'Engineering intern',
				place: 'University College Dublin · Ireland',
				text: 'Unity application for human-computer interaction research: stability, performance and usability. In a fully English-speaking environment.'
			},
			{
				period: 'Education',
				role: 'Master’s degree in computer engineering',
				place: 'ISIMA · Clermont Auvergne INP',
				text: 'Specialized in embedded systems, virtual reality and interactive systems. After two years of intensive preparatory classes (CPGE PSI).'
			}
		],
		skills: [
			{
				group: 'Front-end',
				text: 'Designs turned into responsive, fast and consistent interfaces.',
				items: [
					'HTML5 / CSS3',
					'JavaScript ES6+',
					'TypeScript',
					'SvelteKit',
					'Angular',
					'Tailwind CSS',
					'Vite'
				]
			},
			{
				group: 'Back-end & data',
				text: 'APIs and databases built end to end: data modeling, queries, automation and deployment.',
				items: ['Node.js', 'REST APIs', 'PostgreSQL', 'Supabase', 'Docker', 'Cloudflare']
			},
			{
				group: 'Quality & performance',
				text: 'Responsive, accessible, lightweight interfaces, code-reviewed on every release.',
				items: ['Responsive', 'Mobile-first', 'Optimization', 'Testing', 'GTM tracking']
			},
			{
				group: '3D & interactive',
				text: 'The extra touch: animated interfaces and 3D scenes that stay lightweight.',
				items: ['Three.js', 'WebGL', 'Unity', 'Lens Studio']
			}
		]
	}
};

export const content = { fr, en };
