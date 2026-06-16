# portfolio-unlock Worker

Cloudflare Worker that receives a beacon from the browser whenever a client successfully unlocks a gated portfolio page, then emails you and logs the event.

## How it works

1. Browser (`src/sections/portfolio-gate.js`) fires a one-shot `sendBeacon` POST to `/api/portfolio-unlock` on successful decrypt — only on a fresh login, not on page refresh.
2. This Worker receives it, validates the slug, gathers geo/IP from `request.cf`, deduplicates (same slug+IP within 30 min), logs to KV, and emails you via Resend.
3. The route is pinned to `www.randycounsman.com/api/portfolio-unlock` — every other path falls through to the GitHub Pages origin as before.

## One-time setup

### 1. Create the KV namespace

```bash
cd worker/portfolio-unlock
npx wrangler kv namespace create UNLOCK_LOG
```

Copy the `id` from the output into `wrangler.toml` under `[[kv_namespaces]]`.

### 2. Add secrets

```bash
npx wrangler secret put RESEND_API_KEY   # from resend.com (free tier)
npx wrangler secret put NOTIFY_EMAIL     # e.g. randycounsman@gmail.com
```

`NOTIFY_EMAIL` defaults to `randycounsman@gmail.com` in code if not set.

### 3. Deploy

```bash
just worker-deploy
```

Or manually: `cd worker/portfolio-unlock && npx wrangler deploy`

Verify the route attached: `npx wrangler deployments list`

## Reading the log

```bash
# List all logged events
cd worker/portfolio-unlock
npx wrangler kv key list --binding UNLOCK_LOG --prefix "log:"

# Read a specific event
npx wrangler kv key get --binding UNLOCK_LOG "log:<slug>:<timestamp>:<rand>"
```

## Redeploying after changes

```bash
just worker-deploy
```

## Notification transport

Default is **Resend** (`onboarding@resend.dev` → your Gmail — no domain verification needed).

To switch to **ntfy** (instant phone push, zero account), uncomment the ntfy block in `src/index.js` and comment out the Resend block. Set `npx wrangler secret put NTFY_TOPIC` with your private topic name.

To use `portfolio@randycounsman.com` as the sender (cleaner), verify the `randycounsman.com` domain in Resend first, then change the `from` line in `src/index.js`.
