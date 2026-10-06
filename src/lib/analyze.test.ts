import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { analyze, InputError, NoAnswerError } from "./analyze";
import { mockAnalyze } from "./mock";

const input = { message: "Can you fix the hot water?", recipient: "landlord", channel: "text", situation: "" } as const;

function fakeClient(response: object) {
  const create = vi.fn().mockResolvedValue({
    model: "test-model",
    usage: { input_tokens: 10, output_tokens: 20 },
    ...response,
  });
  return { client: { beta: { messages: { create } } } as unknown as Anthropic, create };
}

describe("analyze", () => {
  it("returns the parsed answer for English input", async () => {
    const sample = mockAnalyze("write").result;
    const { client, create } = fakeClient({
      stop_reason: "end_turn",
      content: [{ type: "text", text: JSON.stringify(sample) }],
    });

    const out = await analyze(input, { client, model: "claude-opus-5-5" });

    expect(out).toMatchObject({ mode: "write", result: sample, usage: { inputTokens: 10, outputTokens: 20 } });
    const request = create.mock.calls[0][0];
    expect(request.fallbacks).toBe("default");
    expect(request.output_config.format.type).toBe("json_schema");
    expect(request.messages[0].content).toContain("<message>\nCan you fix the hot water?\n</message>");
  });

  it("leaves fallbacks off for models that don't accept them", async () => {
    const { client, create } = fakeClient({
      stop_reason: "end_turn",
      content: [{ type: "text", text: JSON.stringify(mockAnalyze("write").result) }],
    });
    await analyze(input, { client, model: "claude-haiku-4-5" });
    expect(create.mock.calls[0][0]).not.toHaveProperty("fallbacks");
  });

  it("explains a refusal instead of crashing", async () => {
    const { client } = fakeClient({ stop_reason: "refusal", content: [] });
    await expect(analyze(input, { client })).rejects.toBeInstanceOf(NoAnswerError);
  });

  it("rejects an answer that doesn't match the schema", async () => {
    const { client } = fakeClient({
      stop_reason: "end_turn",
      content: [{ type: "text", text: JSON.stringify({ recommended: "polite" }) }],
    });
    await expect(analyze(input, { client })).rejects.toThrow();
  });

  it("rejects input with no letters before calling Claude", async () => {
    const { client, create } = fakeClient({});
    await expect(analyze({ ...input, message: "123" }, { client })).rejects.toBeInstanceOf(InputError);
    expect(create).not.toHaveBeenCalled();
  });
});
