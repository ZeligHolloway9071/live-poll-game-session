import { InfraiClient } from "./infrai_client.ts";
import { recordVote, type PollState } from "./poll_decision.ts";

const client = new InfraiClient();
const accountId = process.env.INFRAI_ACCOUNT_ID ?? "game-backend";
const input = process.env.POLL_JSON ?? JSON.stringify({ pollId: "match-42", question: "Next map?", options: ["Ruins", "Harbor"], playerId: "player-7", choice: "Harbor" });
const state: PollState = { counts: {}, moderation: [] };
const next = recordVote(JSON.parse(input), state);
const result = await client.publish({ channel: "game-match-42", event: "poll.updated", data: next, account_id: accountId });
console.log(JSON.stringify({ accepted: next.moderation.length === 0, poll: next, published: result.ok }, null, 2));
