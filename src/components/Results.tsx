import type { ReactNode } from "react";
import { LEVEL_LABELS, LEVELS, type Level } from "@/lib/options";
import type { CheckResult, Rendering, Verdict, WriteResult } from "@/lib/schemas";
import { CopyButton } from "./CopyButton";

function levelName(level: Level | "mixed") {
  if (level === "mixed") return "Mixed";
  return `${LEVEL_LABELS[level].en} (${LEVEL_LABELS[level].ja})`;
}

function RenderingCard({
  title,
  rendering,
  highlight = false,
}: {
  title: ReactNode;
  rendering: Rendering;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border bg-white p-4 dark:bg-stone-900 ${
        highlight
          ? "border-accent ring-1 ring-accent"
          : "border-stone-200 dark:border-stone-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-stone-600 dark:text-stone-300">{title}</div>
        <CopyButton text={rendering.japanese} />
      </div>
      <p lang="ja" className="text-lg leading-relaxed">
        {rendering.japanese}
      </p>
      <p className="text-sm italic text-stone-500 dark:text-stone-400">{rendering.romaji}</p>
      <p className="text-sm text-stone-700 dark:text-stone-300">
        <span className="font-medium">Means:</span> {rendering.meaning}
      </p>
    </div>
  );
}

function Tips({ tips }: { tips: string[] }) {
  if (tips.length === 0) return null;
  return (
    <div className="rounded-xl bg-stone-100 p-4 text-sm dark:bg-stone-900">
      <h3 className="mb-2 font-medium">Tips</h3>
      <ul className="list-disc space-y-1 pl-5 text-stone-700 dark:text-stone-300">
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}

export function WriteView({ result }: { result: WriteResult }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Use {levelName(result.recommended)}</h2>
        <p className="text-stone-600 dark:text-stone-400">{result.why}</p>
      </div>
      {LEVELS.map((level) => (
        <RenderingCard
          key={level}
          highlight={level === result.recommended}
          rendering={result.versions[level]}
          title={
            <>
              {levelName(level)}
              {level === result.recommended && (
                <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">
                  Recommended
                </span>
              )}
            </>
          }
        />
      ))}
      <Tips tips={result.tips} />
    </div>
  );
}

const VERDICT_STYLE: Record<Verdict, { title: string; className: string }> = {
  fits: {
    title: "The tone fits",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  },
  too_casual: {
    title: "Too casual",
    className:
      "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
  },
  too_formal: {
    title: "Too formal",
    className:
      "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
  },
  mixed: {
    title: "Mixed politeness levels",
    className:
      "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
  },
};

export function CheckView({ result }: { result: CheckResult }) {
  const verdict = VERDICT_STYLE[result.verdict];
  return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-xl border p-4 ${verdict.className}`}>
        <h2 className="text-lg font-semibold">{verdict.title}</h2>
        <p className="text-sm opacity-80">
          Written as {levelName(result.detected)} · This calls for {levelName(result.expected)}
        </p>
        <p className="mt-2">{result.summary}</p>
      </div>

      <p className="text-sm text-stone-700 dark:text-stone-300">
        <span className="font-medium">What your message says:</span> {result.meaning}
      </p>

      {result.issues.length > 0 && (
        <ul className="flex flex-col gap-3">
          {result.issues.map((issue) => (
            <li
              key={issue.excerpt + issue.fix}
              className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
            >
              <p lang="ja" className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-900 line-through decoration-red-400 dark:bg-red-950 dark:text-red-200">
                  {issue.excerpt}
                </span>
                <span aria-hidden>→</span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                  {issue.fix}
                </span>
              </p>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{issue.problem}</p>
            </li>
          ))}
        </ul>
      )}

      {result.verdict !== "fits" && (
        <RenderingCard title="Suggested version" rendering={result.corrected} highlight />
      )}

      <Tips tips={result.tips} />
    </div>
  );
}
