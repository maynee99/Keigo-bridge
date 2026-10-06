import type { AnalyzeResponse } from "./schemas";
import type { Mode } from "./detect";

// Fixed sample answers for working on the UI without an API key
// (set MOCK_CLAUDE=1). They ignore the input; the UI labels them as demo data.

const WRITE_SAMPLE: AnalyzeResponse = {
  mode: "write",
  demo: true,
  result: {
    recommended: "polite",
    why: "A landlord is someone you have an ongoing, respectful relationship with but who isn't a business client. です・ます with a soft request reads as respectful without sounding stiff on LINE.",
    versions: {
      casual: {
        japanese: "今朝からお湯が出なくなっちゃった。直してもらえる？",
        romaji: "kesa kara oyu ga denaku natchatta. naoshite moraeru?",
        meaning: "The hot water stopped coming out this morning. Can you fix it for me?",
      },
      polite: {
        japanese: "今朝からお湯が出なくなってしまいました。修理をお願いできますか。",
        romaji: "kesa kara oyu ga denaku natte shimaimashita. shūri o onegai dekimasu ka.",
        meaning: "The hot water stopped coming out this morning. Could I ask you to repair it?",
      },
      keigo: {
        japanese:
          "お忙しいところ恐れ入ります。今朝からお湯が出なくなってしまいました。修理をお願いできますでしょうか。",
        romaji:
          "oisogashii tokoro osoreirimasu. kesa kara oyu ga denaku natte shimaimashita. shūri o onegai dekimasu deshō ka.",
        meaning:
          "Sorry to trouble you when you're busy. The hot water stopped coming out this morning. Might I ask you to repair it?",
      },
    },
    tips: [
      "Start with your room number and name (e.g. 203号室の〇〇です) so they know who's messaging.",
    ],
  },
};

const CHECK_SAMPLE: AnalyzeResponse = {
  mode: "check",
  demo: true,
  result: {
    verdict: "too_casual",
    detected: "casual",
    expected: "polite",
    summary:
      "This is how you'd text a friend. To a landlord, plain form with わ and ごめんね sounds overly familiar, especially when you're asking for patience about rent.",
    meaning: "Tomorrow's rent is going to be a bit late. Sorry!",
    issues: [
      {
        excerpt: "遅れるわ",
        problem: "Plain form with the sentence-ending わ is casual speech for people you're close to.",
        fix: "遅れてしまいそうです",
      },
      {
        excerpt: "ごめんね！",
        problem: "ごめんね is a casual apology between friends or family.",
        fix: "申し訳ありません。",
      },
    ],
    corrected: {
      japanese: "申し訳ありません。明日の家賃のお支払いが少し遅れてしまいそうです。",
      romaji: "mōshiwake arimasen. ashita no yachin no oshiharai ga sukoshi okurete shimaisō desu.",
      meaning: "I'm very sorry. Tomorrow's rent payment looks like it will be a little late.",
    },
    tips: [
      "Landlords care most about the new date. Adding when you'll pay (e.g. 〇日までにお支払いします) makes the message much easier to accept.",
    ],
  },
};

export function mockAnalyze(mode: Mode): AnalyzeResponse {
  return mode === "write" ? WRITE_SAMPLE : CHECK_SAMPLE;
}
