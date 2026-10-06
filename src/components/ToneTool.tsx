"use client";

import { useState } from "react";
import { detectMode, type Mode } from "@/lib/detect";
import {
  CHANNEL_IDS,
  CHANNELS,
  MAX_MESSAGE_CHARS,
  MAX_SITUATION_CHARS,
  RECIPIENT_IDS,
  RECIPIENTS,
  type ChannelId,
  type RecipientId,
} from "@/lib/options";
import type { AnalyzeResponse } from "@/lib/schemas";
import { CheckView, WriteView } from "./Results";

const HINTS: Record<Mode | "none", string> = {
  none: "Type in English to get Japanese, or paste Japanese to check its tone.",
  write: "English detected: I'll write it in Japanese.",
  check: "Japanese detected: I'll check whether the tone fits.",
};

const BUTTON_LABELS: Record<Mode | "none", string> = {
  none: "Go",
  write: "Write it in Japanese",
  check: "Check the tone",
};

const EXAMPLES: { label: string; message: string; recipient: RecipientId; channel: ChannelId }[] = [
  {
    label: "English → landlord",
    message: "The hot water stopped working this morning. Can you fix it?",
    recipient: "landlord",
    channel: "text",
  },
  {
    label: "Japanese → boss",
    message: "部長、明日ちょっと休むね。よろしく！",
    recipient: "boss",
    channel: "text",
  },
];

const fieldClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-stone-700 dark:bg-stone-900";

export function ToneTool() {
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState<RecipientId | "">("");
  const [channel, setChannel] = useState<ChannelId>("text");
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AnalyzeResponse | null>(null);

  const mode = detectMode(message) ?? "none";
  const canSubmit = mode !== "none" && recipient !== "" && !loading;

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, recipient, channel, situation }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Try again.");
      } else {
        setResponse(data as AnalyzeResponse);
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="message" className="text-sm font-medium">
            Your message
          </label>
          <textarea
            id="message"
            rows={4}
            maxLength={MAX_MESSAGE_CHARS}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
            }}
            placeholder="e.g. Sorry, I'll be 10 minutes late to the meeting."
            className={`${fieldClass} resize-y`}
          />
          <p className="text-sm text-stone-500 dark:text-stone-400" aria-live="polite">
            {HINTS[mode]}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recipient" className="text-sm font-medium">
              Who&apos;s it for?
            </label>
            <select
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value as RecipientId)}
              className={fieldClass}
            >
              <option value="" disabled>
                Choose…
              </option>
              {RECIPIENT_IDS.map((id) => (
                <option key={id} value={id}>
                  {RECIPIENTS[id].label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="channel" className="text-sm font-medium">
              How are you sending it?
            </label>
            <select
              id="channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value as ChannelId)}
              className={fieldClass}
            >
              {CHANNEL_IDS.map((id) => (
                <option key={id} value={id}>
                  {CHANNELS[id].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="situation" className="text-sm font-medium">
            Situation <span className="font-normal text-stone-500">(optional)</span>
          </label>
          <input
            id="situation"
            value={situation}
            maxLength={MAX_SITUATION_CHARS}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="e.g. first message to a new client, asking for a favour"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
            <span>Try:</span>
            {EXAMPLES.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => {
                  setMessage(example.message);
                  setRecipient(example.recipient);
                  setChannel(example.channel);
                  setSituation("");
                }}
                className="rounded-full border border-stone-300 px-3 py-1 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
              >
                {example.label}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Thinking…" : BUTTON_LABELS[mode]}
          </button>
        </div>
      </form>

      <section aria-live="polite" className="flex flex-col gap-4">
        {error && (
          <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
            {error}
          </p>
        )}
        {response?.demo && (
          <p className="rounded-xl border border-dashed border-stone-300 p-3 text-sm text-stone-500 dark:border-stone-700">
            Demo mode: this is a fixed sample answer, not a live one.
          </p>
        )}
        {response?.mode === "write" && <WriteView result={response.result} />}
        {response?.mode === "check" && <CheckView result={response.result} />}
      </section>
    </div>
  );
}
