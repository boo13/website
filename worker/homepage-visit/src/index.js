const BOT_UA_RE =
  /bot|crawl|spider|slurp|bing|google|facebook|preview|monitor|curl|wget|headless/i;

const SCREEN_MAX = 8000;

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response(null, { status: 405 });
    }

    const origin = request.headers.get('Origin') ?? '';
    const referer = request.headers.get('Referer') ?? '';
    if (!origin.includes('randycounsman.com') && !referer.includes('randycounsman.com')) {
      return new Response(null, { status: 204 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(null, { status: 204 });
    }

    const ua = request.headers.get('User-Agent') ?? '';

    // Bot filter: CF bot score (when available) or UA regex
    const cf = request.cf ?? {};
    const botScore = cf.botManagement?.score;
    if (botScore !== undefined && botScore < 30) {
      console.log('[homepage-visit] dropped: low bot score', botScore);
      return new Response(null, { status: 204 });
    }
    if (cf.verifiedBotCategory) {
      console.log('[homepage-visit] dropped: verified bot', cf.verifiedBotCategory);
      return new Response(null, { status: 204 });
    }
    if (BOT_UA_RE.test(ua)) {
      console.log('[homepage-visit] dropped: bot UA', ua.slice(0, 60));
      return new Response(null, { status: 204 });
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';

    const event = {
      ts: new Date().toISOString(),
      ip,
      country: cf.country ?? null,
      city: cf.city ?? null,
      region: cf.region ?? null,
      org: cf.asOrganization ?? null,
      timezone: cf.timezone ?? body.tz ?? null,
      ua,
      referrer: body.referrer ?? null,
      language: body.language ?? null,
      path: body.path ?? null,
      screenWidth: body.screenWidth,
      screenHeight: body.screenHeight,
    };

    ctx.waitUntil(handleEvent(event, env));

    return new Response(null, { status: 204 });
  },
};

async function handleEvent(event, env) {
  try {
    const ipHash = await hashIP(event.ip);

    const sw = toScreenDim(event.screenWidth);
    const sh = toScreenDim(event.screenHeight);

    await env.DB.prepare(
      `INSERT INTO visits
         (ts, ip_hash, country, city, region, org, timezone,
          referrer, ua, language, path, screen_w, screen_h)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
      .bind(
        event.ts,
        ipHash,
        event.country,
        event.city,
        event.region,
        trunc(event.org, 120),
        trunc(event.timezone, 120),
        trunc(event.referrer, 500),
        trunc(event.ua, 300),
        trunc(event.language, 120),
        trunc(event.path, 300),
        sw,
        sh
      )
      .run();

    console.log('[homepage-visit] logged', event.country, event.city);
  } catch (err) {
    console.error('[homepage-visit] error:', err);
  }
}

async function hashIP(ip) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(buf))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function trunc(s, max) {
  if (s == null) return null;
  const str = String(s);
  return str.length > max ? str.slice(0, max) : str;
}

function toScreenDim(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0 || n > SCREEN_MAX) return null;
  return Math.round(n);
}
