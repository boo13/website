# homepage-visit Worker

Cloudflare Worker that receives a `sendBeacon` from `index.html` on every human visit, enriches
it with geo/IP data from `request.cf`, filters out bots, and inserts an exact row into D1.

## How it works

1. Browser (`src/utils/track-homepage-visit.js`) fires a one-shot `sendBeacon` POST to
   `/api/homepage-visit` on the first pageview of a session (sessionStorage guards against
   double-counting on refresh).
2. This Worker validates the request, bot-filters via UA regex (and CF bot score when available),
   then inserts one row into the `visits` D1 table — never raw IP, always a SHA-256 prefix hash.
3. The route is pinned to `www.randycounsman.com/api/homepage-visit` — every other path falls
   through to the GitHub Pages origin.

## One-time setup

### 1. Create the D1 database

```bash
cd worker/homepage-visit
npx wrangler d1 create homepage_visits
```

Copy the `database_id` from the output into `wrangler.toml` under `[[d1_databases]]`.

### 2. Apply the schema

```bash
npx wrangler d1 execute homepage_visits --remote --file=schema.sql
```

### 3. Deploy

```bash
just worker-deploy-homepage
```

Or manually: `cd worker/homepage-visit && npx wrangler deploy`

Confirm the route attached: `npx wrangler deployments list`

## Reading the data

```bash
# Recent visits
npx wrangler d1 execute homepage_visits --remote \
  --command "SELECT ts, country, city, referrer, path FROM visits ORDER BY ts DESC LIMIT 50"

# By country, last 7 days
npx wrangler d1 execute homepage_visits --remote \
  --command "SELECT country, COUNT(*) AS hits FROM visits WHERE ts > datetime('now','-7 days') GROUP BY country ORDER BY hits DESC"

# Visits per day
npx wrangler d1 execute homepage_visits --remote \
  --command "SELECT substr(ts,1,10) AS day, COUNT(*) FROM visits GROUP BY day ORDER BY day DESC"
```

## Redeploying after changes

```bash
just worker-deploy-homepage
```
