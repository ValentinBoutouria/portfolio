// Le site est bilingue (?lang=en) : on déclare la bonne langue sur <html>,
// pour l'accessibilité (lecteurs d'écran) et le SEO.
export const handle = async ({ event, resolve }) => {
	const lang = event.url.searchParams.get('lang') === 'en' ? 'en' : 'fr';
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
};
