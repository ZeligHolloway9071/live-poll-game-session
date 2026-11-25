import { recordVote } from "./poll_decision.ts";

const state = { counts: {}, moderation: [] };
const accepted = recordVote({ pollId: "p1", question: "Map?", options: ["A", "B"], playerId: "u1", choice: "B" }, state);
if (accepted.counts.B !== 1 || accepted.moderation.length !== 0) throw new Error("valid vote was not counted");

const queued = recordVote({ pollId: "p1", question: "Map?", options: ["A", "B"], playerId: "u2", choice: "C" }, accepted);
if (queued.moderation[0]?.reason !== "choice_not_in_poll" || queued.counts.C !== undefined) throw new Error("invalid choice was not queued");
console.log("poll decision test passed");
