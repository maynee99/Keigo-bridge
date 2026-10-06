import { describe, expect, it } from "vitest";
import { mockAnalyze } from "./mock";
import {
  AnalyzeRequestSchema,
  CheckResultSchema,
  toOutputSchema,
  WriteResultSchema,
} from "./schemas";

// Structured outputs require every object in the schema to be closed and to
// list all of its properties as required.
function assertClosedObjects(node: unknown, path = "$"): void {
  if (Array.isArray(node)) {
    node.forEach((child, i) => assertClosedObjects(child, `${path}[${i}]`));
    return;
  }
  if (node === null || typeof node !== "object") return;
  const schema = node as Record<string, unknown>;
  if (schema.type === "object") {
    expect(schema.additionalProperties, path).toBe(false);
    expect(new Set(schema.required as string[]), path).toEqual(
      new Set(Object.keys(schema.properties as object)),
    );
  }
  for (const [key, child] of Object.entries(schema)) assertClosedObjects(child, `${path}.${key}`);
}

describe("output schemas", () => {
  it.each([
    ["write", WriteResultSchema],
    ["check", CheckResultSchema],
  ])("%s schema is valid for structured outputs", (_name, schema) => {
    const json = toOutputSchema(schema);
    expect(json).not.toHaveProperty("$schema");
    assertClosedObjects(json);
  });

  it("accepts the demo answers", () => {
    expect(() => WriteResultSchema.parse(mockAnalyze("write").result)).not.toThrow();
    expect(() => CheckResultSchema.parse(mockAnalyze("check").result)).not.toThrow();
  });
});

describe("AnalyzeRequestSchema", () => {
  const valid = { message: "Hello", recipient: "friend", channel: "text" };

  it("accepts a minimal request and defaults the situation", () => {
    expect(AnalyzeRequestSchema.parse(valid)).toEqual({ ...valid, situation: "" });
  });

  it("rejects an empty message", () => {
    expect(AnalyzeRequestSchema.safeParse({ ...valid, message: "   " }).success).toBe(false);
  });

  it("rejects an overly long message", () => {
    expect(AnalyzeRequestSchema.safeParse({ ...valid, message: "a".repeat(1001) }).success).toBe(false);
  });

  it("rejects an unknown recipient", () => {
    expect(AnalyzeRequestSchema.safeParse({ ...valid, recipient: "cat" }).success).toBe(false);
  });
});
