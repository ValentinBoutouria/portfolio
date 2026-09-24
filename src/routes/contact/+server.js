// Formulaire de contact : chaque message part sur un ou deux canaux, selon la config.
//
// Variables d'environnement (fichier .env en local, "Settings > Variables and Secrets" sur Cloudflare) :
//   RESEND_API_KEY   email via Resend (https://resend.com)
//   CONTACT_TO_EMAIL adresse qui reçoit les emails (défaut : l'email du portfolio)
//   CONTACT_FROM     expéditeur (défaut : onboarding@resend.dev, qui n'envoie qu'au
//                    propriétaire du compte Resend tant qu'aucun domaine n'est vérifié)
//   NTFY_URL         notification push sur le téléphone via ntfy (https://ntfy.sh),
//                    ex. https://ntfy.sh/un-nom-de-sujet-long-et-secret
//
// Il suffit qu'un des canauxsoit configuré ; le message est accepté dès qu'un canal réussit.
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { contact } from '$lib/portfolio/data.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendEmail({ name, email, message }) {
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
	if (!res.ok) throw new Error(`Resend ${res.status} : ${await res.text()}`);
}

async function sendPush({ name, email, message }) {
	const res = await fetch(env.NTFY_URL, {
		method: 'POST',
		headers: {
			// En-têtes HTTP en ASCII : le titre accentué passe par l'encodage RFC 2047
			Title: `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(`Portfolio — ${name}`)))}?=`,
			Tags: 'envelope',
			// Un appui sur la notification ouvre directement une réponse par email
			Click: `mailto:${email}`
		},
		body: `${message}\n\n${email}`
	});
	if (!res.ok) throw new Error(`ntfy ${res.status} : ${await res.text()}`);
}

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

	const channels = [];
	if (env.RESEND_API_KEY) channels.push(['email', sendEmail]);
	if (env.NTFY_URL) channels.push(['push', sendPush]);
	if (channels.length === 0) return json({ error: 'not_configured' }, { status: 503 });

	const results = await Promise.allSettled(
		channels.map(([, send]) => send({ name, email, message }))
	);
	results.forEach((r, i) => {
		if (r.status === 'rejected') console.error(`[contact] échec ${channels[i][0]} :`, r.reason);
	});
	if (results.every((r) => r.status === 'rejected')) {
		return json({ error: 'send_failed' }, { status: 502 });
	}
	return json({ ok: true });
}
