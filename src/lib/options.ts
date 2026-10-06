// Shared by the UI (dropdown labels) and the prompt (how each choice is described to Claude).

export const RECIPIENT_IDS = [
  "friend",
  "family",
  "coworker",
  "boss",
  "client",
  "landlord",
  "shop",
  "official",
  "teacher",
  "stranger",
] as const;
export type RecipientId = (typeof RECIPIENT_IDS)[number];

export const RECIPIENTS: Record<RecipientId, { label: string; prompt: string }> = {
  friend: { label: "Friend", prompt: "a close friend of a similar age" },
  family: { label: "Partner / family", prompt: "a partner or family member" },
  coworker: { label: "Coworker (same level)", prompt: "a coworker at the same level (同僚)" },
  boss: { label: "Boss / senior colleague", prompt: "a boss or senior colleague (上司・先輩)" },
  client: { label: "Client / customer", prompt: "a business client or customer (取引先・お客様)" },
  landlord: {
    label: "Landlord / real estate agent",
    prompt: "their landlord or real estate agent (大家さん・不動産会社)",
  },
  shop: { label: "Shop / restaurant staff", prompt: "staff at a shop, restaurant or salon" },
  official: {
    label: "City office / bank",
    prompt: "staff at a city office, bank or other official institution",
  },
  teacher: { label: "Teacher / professor", prompt: "a teacher or university professor (先生)" },
  stranger: { label: "Neighbour / stranger", prompt: "a neighbour or someone they don't know well" },
};

export const CHANNEL_IDS = ["text", "email", "spoken"] as const;
export type ChannelId = (typeof CHANNEL_IDS)[number];

export const CHANNELS: Record<ChannelId, { label: string; prompt: string }> = {
  text: { label: "LINE / text", prompt: "a LINE or text message" },
  email: { label: "Email", prompt: "an email" },
  spoken: { label: "Spoken", prompt: "something said out loud, in person or on the phone" },
};

export const LEVELS = ["casual", "polite", "keigo"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, { en: string; ja: string }> = {
  casual: { en: "Casual", ja: "タメ口" },
  polite: { en: "Polite", ja: "です・ます" },
  keigo: { en: "Keigo", ja: "敬語" },
};

export const MAX_MESSAGE_CHARS = 1000;
export const MAX_SITUATION_CHARS = 200;
