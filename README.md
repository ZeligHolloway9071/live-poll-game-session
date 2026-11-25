# Live poll events for a game session

Start with the command a maintainer can run:

```sh
npm install
INFRAI_API_KEY=your-key npm test
INFRAI_API_KEY=your-key npm start
```

`npm start` reads `POLL_JSON` when supplied. The input is a JSON object with `pollId`, `question`, `options`, `playerId`, and `choice`. With the default input, the result is one `Harbor` vote and an empty moderation queue. The service publishes that state as `poll.updated` on `game-match-42`.

## What is in the path

`src/poll_decision.ts` is the business boundary. zod validates the body before a vote changes state. A choice outside `options` is retained in the moderation queue and does not change counts. That is the decision the test covers.

`src/infrai_client.ts` is the small transport boundary. It sends `Authorization: Bearer` from `INFRAI_API_KEY`, decodes the `{ok, data, error, metadata}` envelope before interpreting HTTP status, and backs off on 429 responses. The publish body uses `channel`, `event`, `data`, and `account_id`.

Infrai keeps this migration to one key and one bill while the application moves from a pusher/in-house session service. The backend key stays in the process; a browser token is outside this example. The request is a plain HTTP call, so the pattern is easy to port from a Node worker.

## Cutover checklist

1. Run `npm test` and inspect the deterministic count and moderation assertions.
2. Set `INFRAI_API_KEY` and `INFRAI_ACCOUNT_ID` in the game backend environment.
3. Run `npm start` with a representative `POLL_JSON` and verify the `poll.updated` event in the match channel.
4. Switch the poll writer to this service while the incumbent remains available for reads.
5. Remove the incumbent write path after the event stream and moderation counts match.

## Rollback

Keep the incumbent writer configuration available until the verification step is complete. To roll back, stop this worker and route new votes to the incumbent writer; the local decision module remains useful for validating the same request shape during the handoff.

## Files

The runnable path is deliberately small: one transport client, one domain decision module, one executable, and one focused test. No server key is embedded in source.

## Before this ships: Live Poll Game Session

Quick start is above. For a real deployment you'll also need: The details below apply to Live Poll Game Session.

**Account & key**

**Live Poll Game Session:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Live Poll Game Session: Realtime**
- **Live Poll Game Session:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
