import { describe, expect, it } from "vitest";
import { loadCases } from "../../evals/cases";
import { detectMode } from "./detect";

describe("detectMode", () => {
  it("treats English as a request to write Japanese", () => {
    expect(detectMode("Can you fix the hot water?")).toBe("write");
  });

  it("treats Japanese as a draft to check", () => {
    expect(detectMode("明日ちょっと休むね")).toBe("check");
  });

  it("keeps a Japanese draft with English loanwords in check mode", () => {
    expect(detectMode("明日のmeeting、OKですか")).toBe("check");
  });

  it("keeps an English message with a name in kanji in write mode", () => {
    expect(detectMode("Please tell 田中 that I'll be late to the meeting tomorrow.")).toBe("write");
  });

  it("returns null when there's nothing to go on", () => {
    expect(detectMode("")).toBeNull();
    expect(detectMode("123 !?")).toBeNull();
  });

  it.each(loadCases())("detects the expected mode for eval case $id", (testCase) => {
    expect(detectMode(testCase.message)).toBe(testCase.expect.mode);
  });
});
