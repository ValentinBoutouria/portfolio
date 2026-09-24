// Envoi du formulaire de contact du portfolio par l'API Resend (https://resend.com).
// Variables d'environnement (fichier .env en local, "Settings > Variables" sur Cloudflare) :
//   RESEND_API_KEY   clé API Resend (obligatoire)
//   CONTACT_TO_EMAIL adresse qui reçoit les messages (défaut : l'email du portfolio)
//   CONTACT_FROM     expéditeur (défaut : onboarding@resend.dev, qui n'envoie qu'au
//                    propriétaire du compte Resend tant qu'aucun domaine n'est vérifié)
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { contact } from '$lib/portfolio/data.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST({ request }) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'invalid' }, { status: 400 });
	}

	const name = String(body.name ?? '').trim();
	const email = String(body.email ?? '').trim();
	const message = String(body.message ?? '').trim();

	// Champ piège invisible : un humain le laisse vide, un bot le remplit
	if (body.website) return json({ ok: true });

	if (!name || name.length > 120 || !EMAIL_RE.test(email) || email.length > 200) {
		return json({ error: 'invalid' }, { status: 400 });
	}
	if (message.length < 2 || message.length > 5000) {
		return json({ error: 'invalid' }, { status: 400 });
	}

	if (!env.RESEND_API_KEY) {
		return json({ error: 'not_configured' }, { status: 503 });
	}

	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: env.CONTACT_FROM || 'Portfolio <onboarding@resend.dev>',
			to: [env.CONTACT_TO_EMAIL || contact.email],
			reply_to: email,
			subject: `Portfolio — message de ${name}`,
			text: `${message}\n\n— ${name} <${email}>`
		})
	});

	if (!res.ok) {
		console.error('[contact] Resend a refusé l’envoi :', res.status, await res.text());
		return json({ error: 'send_failed' }, { status: 502 });
	}
	return json({ ok: true });
}
