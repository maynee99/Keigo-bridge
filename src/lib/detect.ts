export type Mode = "write" | "check";

// Hiragana, katakana (incl. ー), CJK ideographs and half-width katakana.
const JAPANESE_CHAR = /[぀-ヿ㐀-䶿一-鿿ｦ-ﾟ]/g;
const LATIN_LETTER = /[A-Za-z]/g;

// One Japanese character carries roughly as much as a short English word, so a
// Japanese draft with a few English loanwords ("明日のmeeting、OKですか") still
// counts as Japanese, while an English message with a name in kanji does not.
const JAPANESE_WEIGHT = 3;

/**
 * English in → write Japanese for it. Japanese in → check its tone.
 * Decided in code rather than by the model so the UI can show the mode
 * before anything is sent, and so it's cheap to test.
 */
export function detectMode(text: string): Mode | null {
  const japanese = text.match(JAPANESE_CHAR)?.length ?? 0;
  const latin = text.match(LATIN_LETTER)?.length ?? 0;
  if (japanese === 0 && latin === 0) return null;
  return japanese * JAPANESE_WEIGHT >= latin ? "check" : "write";
}
