import { guardRequest, hashIP } from '../../shared/utils.js';

const KNOWN_SLUGS = new Set(['0626', 'design']);
const RATE_LIMIT_TTL = 60 * 30; // 30 minutes — one notification per slug+IP per window

export default {
  async fetch(request, env, ctx) {
    const guard = await guardRequest(request);
    if (guard.response) return guard.response;
    const body = guard.body;

    const { slug } = body;
    if (!KNOWN_SLUGS.has(slug)) {
      return new Response(null, { status: 204 });
    }

    // Gather server-trusted context; request.cf is undefined in wrangler dev / preview
    const cf = request.cf ?? {};
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';

    const event = {
      slug,
      timestamp: new Date().toISOString(),
      ip,
      country: cf.country ?? 'unknown',
      city: cf.city ?? 'unknown',
      region: cf.region ?? 'unknown',
      timezone: cf.timezone ?? body.tz ?? 'unknown',
      org: cf.asOrganization ?? 'unknown',
      ua: request.headers.get('User-Agent') ?? 'unknown',
      referrer: body.referrer ?? '',
      screenWidth: body.screenWidth,
      screenHeight: body.screenHeight,
      language: body.language ?? '',
    };

    // Return immediately; do logging + notification after the response
    ctx.waitUntil(handleEvent(event, env));

    return new Response(null, { status: 204 });
  },
};

async function handleEvent(event, env) {
  try {
    // Derive one hash for both rate-limit key and persistence; never store raw IP.
    const ipHash = await hashIP(event.ip);
    delete event.ip;
    event.ip_hash = ipHash;

    const rlKey = `rl:${event.slug}:${ipHash}`;

    const recent = await env.UNLOCK_LOG.get(rlKey);
    if (recent) {
      console.log(`[handleEvent] rate-limited: ${rlKey}`);
      return;
    }

    await env.UNLOCK_LOG.put(rlKey, '1', { expirationTtl: RATE_LIMIT_TTL });

    // Persist the event (ip_hash stored, raw ip already deleted)
    const logKey = `log:${event.slug}:${event.timestamp}:${crypto.randomUUID()}`;
    await env.UNLOCK_LOG.put(logKey, JSON.stringify(event));

    await notify(event, env);
  } catch (err) {
    console.error('[handleEvent] uncaught error:', err);
  }
}

function summary(event) {
  const loc =
    [event.city, event.region, event.country].filter((v) => v && v !== 'unknown').join(', ') ||
    'unknown location';
  return [
    `🔓 ${event.slug} portfolio unlocked`,
    `📍 ${loc} (${event.org})`,
    `🕐 ${event.timestamp}`,
    `🌐 ${event.referrer || 'direct'}`,
    `💻 ${event.ua.slice(0, 100)}`,
  ].join('\n');
}

async function notify(event, env) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[notify] RESEND_API_KEY not set');
    return;
  }

  const to = env.NOTIFY_EMAIL ?? 'randycounsman@gmail.com';
  const subject = `🔓 ${event.slug} portfolio unlocked — ${event.city}, ${event.country}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'portfolio@randycounsman.com',
        to: [to],
        subject,
        text: summary(event),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[notify] Resend ${res.status}: ${body}`);
    } else {
      console.log(`[notify] sent to ${to} (${res.status})`);
    }
  } catch (err) {
    console.error('[notify] fetch failed:', err);
  }
}
