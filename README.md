# 与神同行 / God With Me

A bilingual daily Christian reflection app with morning action items, evening journaling, quiet prayer, gentle synthesized background music, and an optional AI companion.

## Run locally

```sh
npm install
npm run dev
```

Use the local URL printed by the server. `npm run build` produces the Cloudflare Worker build. The Sites manifest retains this project's private hosting identity.

## Features

- Chinese / English interface, remembered on this device. Journal content is preserved exactly as written, not translated.
- Morning: add and edit action items; mark complete; remove with undo.
- Evening: the same day's checklist, accomplishments, gratitude and prayer reflections.
- Date navigation preserves previous entries. Journal entries are explicitly device-local using `localStorage`, never uploaded to the AI service. Clearing browser storage removes entries; devices do not synchronize.
- Quiet prayer: 1, 3 and 5 minute timer with pause/reset, using a wall-clock deadline.
- Music: locally synthesized gentle notes, user-initiated playback, pause and volume. No external recordings or music tracking.
- One-shot 20-minute in-page grounding reminder. Keep the page open. This is not an operating-system notification or scheduled background task.
- Daily passage rotates through three CUV / KJV passages. Companion never speaks as God.

## Optional AI service

The app works without AI configuration and honestly labels the companion as disconnected. For hosted setup use the OpenAI Developers plugin's approved key connection flow, then set `OPENAI_API_KEY` as a Sites secret; set `OPENAI_MODEL` to a model your account supports. For local setup put server secrets in the ignored `.env` file, using `.env.example` as a guide. Do not expose keys in client code or Git.

The server uses the [Responses API](https://developers.openai.com/api/docs/guides/text), `store: false`, a bounded conversation window, input validation and request timeout. Only explicitly sent chat messages go to OpenAI; journal data is not included. Chat messages remain in page memory and disappear on refresh. Private Sites hosting supplies access protection; preserve owner-only hosting while using the paid chat endpoint.

## Validation

Run `npx tsc --noEmit`, `node --experimental-strip-types --test tests/journal.test.mjs`, and `npm run build`. The optional WebMCP tool `start_quiet_time` registers only when supported; no supported WebMCP validation context was available during initial development. A real AI response requires a configured key and is not tested when that connection is absent.
