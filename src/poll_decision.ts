import { z } from "zod";

export const PollRequest = z.object({
  pollId: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  playerId: z.string().min(1),
  choice: z.string().min(1)
});
export type PollRequest = z.infer<typeof PollRequest>;

export type ModerationItem = { pollId: string; playerId: string; choice: string; reason: string };
export type PollState = { counts: Record<string, number>; moderation: ModerationItem[] };

export function recordVote(input: unknown, state: PollState): PollState {
  const request = PollRequest.parse(input);
  if (!request.options.includes(request.choice)) {
    return {
      counts: state.counts,
      moderation: [...state.moderation, { pollId: request.pollId, playerId: request.playerId, choice: request.choice, reason: "choice_not_in_poll" }]
    };
  }
  return { counts: { ...state.counts, [request.choice]: (state.counts[request.choice] ?? 0) + 1 }, moderation: state.moderation };
}
