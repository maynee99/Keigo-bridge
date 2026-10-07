// Runs every case in evals/cases.json through the real Claude call and writes
// a Markdown report to evals/results/. Costs real API credit (roughly $1-2 per
// full run on the default model). Usage: npm run eval [-- --only <id-substring>]

import { mkdirSync, writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { analyze, DEFAULT_MODEL, type AnalyzeOutput } from "../src/lib/analyze";
import { detectMode } from "../src/lib/detect";
import { CHANNELS, RECIPIENTS } from "../src/lib/options";
import { loadCases, type EvalCase } from "./cases";

type Row = {
  testCase: EvalCase;
  got: string;
  pass: boolean;
  output: string;
  seconds: number;
  tokens: { input: number; output: number };
  errored: boolean;
};

function expectedLabel(c: EvalCase): string {
  return c.expect.mode === "write" ? c.expect.recommended.join(" / ") : c.expect.verdict;
}

function score(c: EvalCase, out: AnalyzeOutput): { got: string; pass: boolean; output: string } {
  if (c.expect.mode === "write" && out.mode === "write") {
    const got = out.result.recommended;
    return {
      got,
      pass: c.expect.recommended.includes(got),
      output: out.result.versions[got].japanese,
    };
  }
  if (c.expect.mode === "check" && out.mode === "check") {
    const got = out.result.verdict;
    const pass = c.expect.verdict === "not_fits" ? got !== "fits" : got === c.expect.verdict;
    return { got, pass, output: got === "fits" ? "(unchanged)" : out.result.corrected.japanese };
  }
  return { got: `wrong mode: ${out.mode}`, pass: false, output: "" };
}

function cell(text: string): string {
  return text.replaceAll("|", "\\|").replaceAll("\n", " ");
}

async function main() {
  const onlyIndex = process.argv.indexOf("--only");
  const only = onlyIndex === -1 ? undefined : process.argv[onlyIndex + 1];
  const cases = loadCases().filter((c) => !only || c.id.includes(only));
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  // Claude Code cloud sessions hide ANTHROPIC_API_KEY from the commands they run,
  // so there the key is set as KEIGO_EVAL_KEY instead. Locally, ANTHROPIC_API_KEY works as usual.
  const evalKey = process.env.KEIGO_EVAL_KEY;
  const client = evalKey ? new Anthropic({ apiKey: evalKey }) : new Anthropic();
  console.log(`Key: ${evalKey ? "KEIGO_EVAL_KEY" : "default (ANTHROPIC_API_KEY)"} · Model: ${model}\n`);

  const rows: Row[] = [];
  for (const testCase of cases) {
    const started = Date.now();
    try {
      // Mode comes from the same detector the app uses; a wrong detection fails the case.
      const out = await analyze(testCase, {
        client,
        model,
        mode: detectMode(testCase.message) ?? undefined,
      });
      const scored = score(testCase, out);
      rows.push({
        testCase,
        ...scored,
        seconds: (Date.now() - started) / 1000,
        tokens: { input: out.usage.inputTokens, output: out.usage.outputTokens },
        errored: false,
      });
    } catch (err) {
      rows.push({
        testCase,
        got: `error: ${err instanceof Error ? err.message : String(err)}`,
        pass: false,
        output: "",
        seconds: (Date.now() - started) / 1000,
        tokens: { input: 0, output: 0 },
        errored: true,
      });
    }
    const last = rows.at(-1)!;
    console.log(`${last.pass ? "PASS" : "FAIL"}  ${testCase.id}  (got ${last.got}, ${last.seconds.toFixed(1)}s)`);
  }

  // A run where nothing reached Claude (missing or invalid key, no credit) says
  // nothing about quality, so don't write a 0/N report that could be mistaken for one.
  if (rows.every((r) => r.errored)) {
    console.error(
      "\nNo case got an answer from Claude, so no report was written. Check the API key (KEIGO_EVAL_KEY or ANTHROPIC_API_KEY) and your credit balance.",
    );
    process.exitCode = 1;
    return;
  }

  const passed = rows.filter((r) => r.pass).length;
  const avgSeconds = rows.reduce((sum, r) => sum + r.seconds, 0) / rows.length;
  const inputTokens = rows.reduce((sum, r) => sum + r.tokens.input, 0);
  const outputTokens = rows.reduce((sum, r) => sum + r.tokens.output, 0);
  const date = new Date().toISOString().slice(0, 10);

  const report = [
    `# Eval run: ${date}`,
    "",
    `- Model: \`${model}\``,
    `- Automatic score: **${passed}/${rows.length}** cases picked the expected level or verdict`,
    `- Average response time: ${avgSeconds.toFixed(1)}s`,
    `- Tokens: ${inputTokens.toLocaleString()} input, ${outputTokens.toLocaleString()} output`,
    "",
    "The automatic score only checks the *decision* (which level, which verdict).",
    "Whether the Japanese itself sounds natural needs a native speaker: fill in the last column (1 = wrong or unnatural, 5 = exactly what I'd send).",
    "",
    "| Case | To / via | Input | Expected | Got | | Japanese output | Native grade (1-5) |",
    "|---|---|---|---|---|---|---|---|",
    ...rows.map((r) =>
      [
        "",
        r.testCase.id,
        `${RECIPIENTS[r.testCase.recipient].label} / ${CHANNELS[r.testCase.channel].label}`,
        cell(r.testCase.message),
        expectedLabel(r.testCase),
        cell(r.got),
        r.pass ? "✅" : "❌",
        cell(r.output),
        "",
        "",
      ].join(" | ").trim(),
    ),
    "",
  ].join("\n");

  mkdirSync("evals/results", { recursive: true });
  const path = `evals/results/${date}-${model}.md`;
  writeFileSync(path, report);
  console.log(`\n${passed}/${rows.length} passed. Report: ${path}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
