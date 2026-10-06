import { z } from "zod";
import {
  CHANNEL_IDS,
  LEVELS,
  MAX_MESSAGE_CHARS,
  MAX_SITUATION_CHARS,
  RECIPIENT_IDS,
} from "./options";

export const AnalyzeRequestSchema = z.object({
  message: z.string().trim().min(1, "Type a message first.").max(MAX_MESSAGE_CHARS),
  recipient: z.enum(RECIPIENT_IDS),
  channel: z.enum(CHANNEL_IDS),
  situation: z.string().trim().max(MAX_SITUATION_CHARS).default(""),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

// The descriptions below are sent to Claude as part of the output schema,
// so they double as field-level instructions.

const Level = z.enum(LEVELS);

const Rendering = z.object({
  japanese: z.string().describe("The message in natural Japanese."),
  romaji: z.string().describe("Modified Hepburn romaji of `japanese`, words separated by spaces."),
  meaning: z
    .string()
    .describe(
      "Close English back-translation of `japanese` (not of the user's original), so they can verify what they'd actually be saying.",
    ),
});
export type Rendering = z.infer<typeof Rendering>;

export const WriteResultSchema = z.object({
  recommended: Level.describe("The level that best fits this recipient and channel."),
  why: z.string().describe("One or two sentences in plain English on why that level fits."),
  versions: z.object({
    casual: Rendering,
    polite: Rendering,
    keigo: Rendering,
  }),
  tips: z
    .array(z.string())
    .describe("0-3 short, practical cultural notes for this situation. Empty if nothing useful to add."),
});
export type WriteResult = z.infer<typeof WriteResultSchema>;

export const VERDICTS = ["fits", "too_casual", "too_formal", "mixed"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const CheckResultSchema = z.object({
  verdict: z.enum(VERDICTS),
  detected: z
    .enum([...LEVELS, "mixed"])
    .describe("The politeness level the user's draft is actually written in."),
  expected: Level.describe("The level this recipient and channel call for."),
  summary: z.string().describe("One or two sentences in plain English: does it fit, and why."),
  meaning: z.string().describe("Close English back-translation of the user's draft as written."),
  issues: z
    .array(
      z.object({
        excerpt: z.string().describe("The problem phrase, copied exactly from the user's draft."),
        problem: z.string().describe("Short plain-English explanation."),
        fix: z.string().describe("The Japanese to use instead."),
      }),
    )
    .describe("Each phrase that is wrong for this context. Empty when the verdict is `fits`."),
  corrected: Rendering.describe(
    "The draft rewritten at the right level with the same meaning. If the verdict is `fits`, return the draft unchanged.",
  ),
  tips: z
    .array(z.string())
    .describe("0-3 short, practical cultural notes, including optional polish. Empty if nothing useful to add."),
});
export type CheckResult = z.infer<typeof CheckResultSchema>;

export type AnalyzeResponse =
  | { mode: "write"; result: WriteResult; demo?: boolean }
  | { mode: "check"; result: CheckResult; demo?: boolean };

/** JSON Schema for Claude's structured output, generated from the Zod schema so the two can't drift. */
export function toOutputSchema(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema: Record<string, unknown> = { ...z.toJSONSchema(schema) };
  delete jsonSchema.$schema;
  return jsonSchema;
}
