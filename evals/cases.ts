import { readFileSync } from "node:fs";
import { z } from "zod";
import { CHANNEL_IDS, LEVELS, RECIPIENT_IDS } from "../src/lib/options";
import { VERDICTS } from "../src/lib/schemas";

const EvalCaseSchema = z.object({
  id: z.string(),
  message: z.string(),
  recipient: z.enum(RECIPIENT_IDS),
  channel: z.enum(CHANNEL_IDS),
  situation: z.string().default(""),
  expect: z.discriminatedUnion("mode", [
    // Any of these levels counts as correct. Some contexts genuinely allow two.
    z.object({ mode: z.literal("write"), recommended: z.array(z.enum(LEVELS)).min(1) }),
    // "not_fits" = any verdict except "fits" (e.g. a wrong phrase at the right level).
    z.object({ mode: z.literal("check"), verdict: z.enum([...VERDICTS, "not_fits"]) }),
  ]),
});
export type EvalCase = z.infer<typeof EvalCaseSchema>;

/** Paths are relative to the repo root; run evals and tests from there. */
export function loadCases(path = "evals/cases.json"): EvalCase[] {
  return z.array(EvalCaseSchema).parse(JSON.parse(readFileSync(path, "utf8")));
}
