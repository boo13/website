const HOST = 'randycounsman.com';

function hostMatches(value) {
  if (!value) return false;
  try {
    const { hostname } = new URL(value);
    return hostname === HOST || hostname.endsWith(`.${HOST}`);
  } catch {
    return false;
  }
}

/**
 * Guards a Worker fetch handler: checks method, validates origin/referer,
 * and parses the JSON body. Returns { response } on rejection or { body } on success.
 */
export async function guardRequest(request) {
  if (request.method !== 'POST') {
    return { response: new Response(null, { status: 405 }) };
  }

  const origin = request.headers.get('Origin') ?? '';
  const referer = request.headers.get('Referer') ?? '';
  if (!hostMatches(origin) && !hostMatches(referer)) {
    return { response: new Response(null, { status: 204 }) };
  }

  try {
    const body = await request.json();
    return { body };
  } catch {
    return { response: new Response(null, { status: 204 }) };
  }
}

/** SHA-256 hash of an IP address, truncated to 8 hex bytes (16 chars). */
export async function hashIP(ip) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(buf))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
