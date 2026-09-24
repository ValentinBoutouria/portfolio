# Portfolio — Valentin Boutouria

Ingénieur logiciel full-stack. Site bilingue (FR / EN), SvelteKit 2 + Svelte 5, déployé sur Cloudflare Pages.

- **Contenu** : tout le texte est dans `src/lib/portfolio/data.js` (FR et EN).
- **Médias** : vidéos, images et textures dans `static/media/`.
- **Sphère 3D** : `src/lib/portfolio/Sphere.svelte` (Three.js chargé en différé, shader matcap).
- **Formulaire de contact** : route serveur `src/routes/contact/+server.js`, envoi via Resend.

## Développement

```bash
pnpm install
pnpm dev
```

## Déploiement (Cloudflare Pages)

- Preset : SvelteKit
- Commande de build : `pnpm build`
- Dossier de sortie : `.svelte-kit/cloudflare`
- Variable d'environnement : `RESEND_API_KEY` (voir `.env.example`)

Chaque push sur `main` redéploie le site ; chaque branche a son URL de prévisualisation.
