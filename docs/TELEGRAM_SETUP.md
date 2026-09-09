# Telegram reporting bot - setup & verify (Cal-run)

Two-way Telegram channel for Cal. Code lives in `src/lib/telegram.ts` and the
inbound webhook at `src/app/api/telegram/webhook/route.ts`. Everything is
ENV-GATED: with no credentials it no-ops honestly with
`{ ok: false, reason: 'Telegram not configured' }` - it never fakes a send and
never fabricates pipeline data.

This cannot be live-tested from the build box (no credentials). The steps below
are what Cal must run and verify.

## 1. Environment variables

Add to `.env.local` / `.env.production` (already in `.env.example`):

```
TELEGRAM_BOT_TOKEN=        # from @BotFather
TELEGRAM_CHAT_ID=          # the chat that receives the daily brief
TELEGRAM_WEBHOOK_SECRET=   # long random string; guards the webhook
```

All three are server-only. Never prefix with `NEXT_PUBLIC_`.

- **Bot token:** message @BotFather → `/newbot` → copy the token.
- **Chat id:** message your new bot once, then open
  `https://api.telegram.org/bot<TOKEN>/getUpdates` and read `message.chat.id`.
- **Webhook secret:** any long random string (e.g. `openssl rand -hex 32`).

## 2. Register the webhook (with the secret token)

Point Telegram at the deployed route and pin the secret so the header is echoed
on every update:

```
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://renewably.ie/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

The route rejects any request whose `X-Telegram-Bot-Api-Secret-Token` header
does not equal `TELEGRAM_WEBHOOK_SECRET` (401). Without the secret set, the route
returns `{ ok: false, reason: 'Telegram not configured' }`.

## 3. Verify

- **Config (no secrets leaked):** `GET https://renewably.ie/api/telegram/webhook`
  → `{ ok, configured, webhookSecretSet }`.
- **Bot alive / two-way:** send `/ping` in the chat → expect `pong ✅ <ts>`.
- **Help:** send `/help` → command list.
- **Brief:** send `/brief` → the daily brief built from real `deals` rows
  (`select('*')`, so it works before or after the canonical migration). If
  Supabase or a column is unavailable it replies with an honest
  `Could not build brief: <reason>` instead of inventing numbers.
- **Outbound helper:** from server code, `sendTelegram('hello')` returns
  `{ ok: true, messageId }` on success, or `{ ok: false, reason }` otherwise.

## 4. Cron - NOT wired yet (TODO)

No schedule is wired (per the build step). When ready, a daily job should:

1. Query open deals with the service client (`createServiceClient()`), e.g.
   `supabase.from('deals').select('*')`.
2. Optionally enrich company names (see `handleBrief` in the webhook route).
3. Call `sendDailyBrief(deals)` from `src/lib/telegram.ts` (build + send in one).

Suggested time: ~07:30 Europe/Dublin. Wire via the estate cron layer or a Next
route hit by an external scheduler - do not add it before Cal asks.
