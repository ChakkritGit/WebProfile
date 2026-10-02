# status

Cloudflare Worker behind status.chakkritton.com. Every 5 minutes it checks the portfolio, Spent-Cost and the whiteboard, keeps the history in Workers KV, and pushes an alert through Spent-Cost's edge function when something is down for two checks in a row.

Setup, in order:

1. `cd status && npm install`
2. `npx wrangler kv namespace create STATUS`, then paste the id into `wrangler.toml`
3. `npx wrangler secret put STATUS_SECRET` - a new random value, unrelated to the morning-run secret; set the same value in Spent-Cost in step 5
4. `npx wrangler secret put HEALTH_TOKEN` - a new random value; set the same value on Mr. Worldwide with `cd ../worker && npx wrangler secret put HEALTH_TOKEN`
5. Spent-Cost: run migration `0004_heartbeats.sql`, `npx supabase secrets set STATUS_SECRET=<same value> ALERT_USER_ID=<uuid>`, `npx supabase functions deploy push-reminders --no-verify-jwt`
6. `npx wrangler deploy` for `worker/`, then for `status/` last. The Spent-Cost function (step 5) must already be live: the old one ignores `x-status-secret` and answers 401, so every check and alert would fail until it is.
7. Allow notifications in Spent-Cost Settings on the phone that should get alerts

Try it locally: `npx wrangler dev --test-scheduled`, then `curl "http://localhost:8787/__scheduled?cron=*/5+*+*+*+*"` and open http://localhost:8787.
