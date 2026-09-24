import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Déploiement sur Cloudflare Pages (la route /contact tourne en fonction serveur)
		adapter: adapter()
	}
};

export default config;
