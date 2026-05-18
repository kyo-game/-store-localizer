// app/api/translate/route.ts

import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type FieldKey =
  | "title"
  | "subtitle"
  | "promotionalText"
  | "description"
  | "keywords"
  | "whatsNew"
  | "iapDisplayName"
  | "iapDescription"
  | "subscriptionGroupDisplayName"
  | "subscriptionCustomName";

type Body = {
  sourceLocale: string;
  targetLocale: string;
  fieldKey: FieldKey;
  text: string;
};

type TranslationContext = {
  sourceTitle?: string;
  translatedTitle?: string;
};

type TranslationResult = {
  text: string;
  warning: boolean;
  error: boolean;
};

type CandidateResult = {
  text: string;
  usedRewrite: boolean;
};

const FIELD_LIMITS: Record<FieldKey, number> = {
  title: 30,
  subtitle: 30,
  promotionalText: 170,
  description: 4000,
  keywords: 100,
  whatsNew: 4000,
  iapDisplayName: 35,
  iapDescription: 55,
  subscriptionGroupDisplayName: 75,
  subscriptionCustomName: 30,
};

const KANA_RE = /[\u3040-\u30ff]/;
const HAN_RE = /[\u3400-\u4dbf\u4e00-\u9fff]/;
const HANGUL_RE = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/;
const ARABIC_RE = /[\u0600-\u06ff]/;
const HEBREW_RE = /[\u0590-\u05ff]/;
const CYRILLIC_RE = /[\u0400-\u04ff]/;

const URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi;
const HANDLE_RE = /(^|\s)@[A-Za-z0-9_]+/g;
const DOMAIN_RE =
  /\b(?:[A-Za-z0-9-]+\.)+(?:com|net|org|io|jp|co|app|dev|info|biz|tv|me|ai|gg|store|games?|site|online|link)(?:\/[^\s]*)?/gi;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const ENGLISH_WORD_RE = /\b[A-Za-z][A-Za-z'-]{1,}\b/;

const SAFE_ENGLISH_TERMS_RE =
  /\b(?:Wi-?Fi|iOS|iPadOS|macOS|watchOS|tvOS|Android|Google|Apple|App Store|Google Play|YouTube|Youtube|Twitter|Facebook|Instagram|TikTok|X|LINE|Discord|WhatsApp|OpenAI|ChatGPT|API|SDK|URL|HTTP|HTTPS|AI|VR|AR|QR|GPS|SNS|CPU|GPU|USB|PDF|CSV|JSON|HTML|CSS|JavaScript|TypeScript|React|Next\.js|Unity|Unreal|Steam|Nintendo|PlayStation|Xbox)\b/gi;

const SUSPICIOUS_TRAILING_GARBAGE_RE =
  /[】〕］》」』】【、】【〔［《「『]+$/u;
const SUSPICIOUS_ORPHAN_GARBAGE_RE =
  /(^|[\s:：;；,.!?！？\-–—/\\])([】〕］》」』]+)$/u;

function countChars(text: string) {
  return text.length;
}

function normalizeOutput(text: string) {
  return text.replace(/\r\n/g, "\n").trim();
}

function hardClip(text: string, limit: number) {
  return normalizeOutput(text).slice(0, limit).trim();
}

function isEnglishLocale(locale: string) {
  return locale.startsWith("en");
}

function getTitleConsistencyFamily(locale: string) {
  if (["en-US", "en-GB", "en-CA", "en-AU"].includes(locale)) return "en";
  if (["es-ES", "es-MX"].includes(locale)) return "es";
  if (["pt-BR", "pt-PT"].includes(locale)) return "pt";
  return "";
}

function shouldReturnSourceTitle(params: {
  sourceLocale: string;
  targetLocale: string;
  fieldKey: FieldKey;
  text: string;
  limit: number;
}) {
  return (
    params.fieldKey === "title" &&
    isEnglishLocale(params.sourceLocale) &&
    isEnglishLocale(params.targetLocale) &&
    countChars(normalizeOutput(params.text)) <= params.limit
  );
}

function trimKeywordsToLimit(text: string, limit: number) {
  const parts = text
    .replace(/，/g, ",")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => !/[{}[\]\\`]/.test(x))
    .filter((x) => x.length >= 2);

  const deduped: string[] = [];
  for (const part of parts) {
    if (!deduped.includes(part)) deduped.push(part);
  }

  while (deduped.length > 0 && countChars(deduped.join(",")) > limit) {
    deduped.pop();
  }

  return deduped.join(",");
}

function finalizeFieldText(fieldKey: FieldKey, text: string, limit: number) {
  const normalized = normalizeOutput(text);
  return fieldKey === "keywords"
    ? trimKeywordsToLimit(normalized, limit)
    : normalized;
}

function isThirtyCharField(fieldKey: FieldKey) {
  return FIELD_LIMITS[fieldKey] === 30;
}

function isShortForceField(fieldKey: FieldKey) {
  return (
    fieldKey === "title" ||
    fieldKey === "subtitle" ||
    fieldKey === "iapDisplayName" ||
    fieldKey === "subscriptionCustomName"
  );
}

function shouldPreserveUrls(fieldKey: FieldKey) {
  return fieldKey === "description" || fieldKey === "whatsNew";
}

function shouldAutoCleanGarbage(fieldKey: FieldKey) {
  return (
    fieldKey === "title" ||
    fieldKey === "subtitle" ||
    fieldKey === "promotionalText" ||
    fieldKey === "iapDisplayName" ||
    fieldKey === "iapDescription" ||
    fieldKey === "subscriptionGroupDisplayName" ||
    fieldKey === "subscriptionCustomName"
  );
}

function hasUnexpectedEnglishWordsWarning(
  targetLocale: string,
  text: string
) {
  if (!text || targetLocale.startsWith("en")) return false;

  const scrubbed = text
    .replace(URL_RE, " ")
    .replace(EMAIL_RE, " ")
    .replace(HANDLE_RE, " ")
    .replace(DOMAIN_RE, " ")
    .replace(SAFE_ENGLISH_TERMS_RE, " ");

  return ENGLISH_WORD_RE.test(scrubbed);
}

function getUrlPreservationRules(fieldKey: FieldKey) {
  if (!shouldPreserveUrls(fieldKey)) return "";

  return [
    "If the source text contains URLs such as http://, https://, or www., preserve every URL exactly as written.",
    "Preserve @handles, email addresses, domain names, and URL paths exactly as written.",
    "Do not translate, rewrite, shorten, normalize, or remove URLs, @handles, email addresses, or domain names.",
    "Do not use URL preservation as a reason to preserve nearby app names, game names, product names, or title-like phrases.",
  ].join(" ");
}

function getLocaleCodeRules(sourceLocale: string, targetLocale: string) {
  return [
    "Locale codes must be followed exactly.",
    "Do not infer a different language from the country or region part of a locale code.",
    "The language part before the hyphen is the required output language.",
    "en-US means English for the United States.",
    "en-GB means English for the United Kingdom.",
    "en-CA means Canadian English, not French Canadian.",
    "en-AU means Australian English.",
    "fr-CA means Canadian French.",
    "fr-FR means French for France.",
    "es-MX means Spanish for Mexico.",
    "es-ES means Spanish for Spain.",
    "pt-BR means Brazilian Portuguese.",
    "pt-PT means European Portuguese.",
    "zh-Hans means Simplified Chinese.",
    "zh-Hant means Traditional Chinese.",
    `Source locale: ${sourceLocale}.`,
    `Target locale: ${targetLocale}.`,
  ].join(" ");
}

function getBrandTranslationRules() {
  return [
    "Do not preserve app names, game names, product names, subscription names, or title-like phrases merely because they look like brands.",
    "If an app name, game name, product name, subscription name, or title-like phrase is made from meaningful generic words, translate those words naturally into the target language.",
    "This rule applies to titles, subtitles, descriptions, release notes, IAP names, subscription names, and repeated series references.",
    "If the same app name, game name, product name, or series name appears multiple times, translate it consistently.",
    "Only preserve truly fixed technical identifiers, URLs, @handles, email addresses, domain names, file paths, code identifiers, platform names, API names, and official untranslatable proper nouns.",
    "Do not treat ordinary English words as untranslatable merely because they are capitalized.",
    "Do not treat title case, camelCase, PascalCase, trademarks, or store-style capitalization as proof that the text must remain English.",
    "For non-English target locales, meaningful English words in names should normally be translated unless they are fixed technical identifiers, URLs, handles, domains, or official untranslatable proper nouns.",
    "Game genre words and store genre expressions should also be translated naturally when the target language has a natural expression for them.",
  ].join(" ");
}

function getContextRules(context?: TranslationContext) {
  if (!context?.sourceTitle || !context.translatedTitle) return "";

  return [
    "Use the provided cross-field name context for this same target locale.",
    `Source app title: ${context.sourceTitle}`,
    `Translated app title for this target locale: ${context.translatedTitle}`,
    "When the exact source app title appears alone, use the translated app title above, adjusted naturally for grammar if necessary.",
    "When the source app title appears as the main app title inside a normal sentence, use the translated app title above, adjusted naturally for grammar if necessary.",
    "For related series titles, related game names, sequel names, spin-off names, or title-like phrases that contain the source app title plus extra meaningful words, do not mechanically combine the translated main title with the remaining words.",
    "Translate related series titles and related game names naturally as complete names in the target language.",
    "If fully translating a related title would sound unnatural, preserve only the fixed title-like name when necessary.",
    "Do not force the translated main title to become the base of every related title.",
    "Do not preserve the source app title in this field merely because it looks like a brand.",
    "Do not mechanically replace text after translation; write the sentence naturally while using the translated app title consistently where it naturally fits.",
    "URLs, @handles, email addresses, domains, platform names, and technical identifiers must still remain unchanged.",
  ].join(" ");
}

function getTitleLocaleConsistencyRule(targetLocale: string) {
  const family = getTitleConsistencyFamily(targetLocale);

  if (family === "en") {
    return [
      "For app titles, keep wording identical across en-US, en-GB, en-CA, and en-AU whenever the source title is English.",
      "If the source title is already English and fits the limit, keep the exact same title for all English locales.",
      "Do not create regional title variants such as different words for candy, sweets, or lollies.",
    ].join(" ");
  }

  if (family === "es") {
    return [
      "For app titles, keep wording identical across es-ES and es-MX.",
      "Use neutral Spanish suitable for both Spain and Mexico.",
      "Do not introduce regional title variation unless absolutely necessary.",
    ].join(" ");
  }

  if (family === "pt") {
    return [
      "For app titles, keep wording identical across pt-BR and pt-PT.",
      "Use neutral Portuguese suitable for both Brazil and Portugal.",
      "Do not introduce regional title variation unless absolutely necessary.",
    ].join(" ");
  }

  return "";
}

function getMeaningResolutionRules(
  fieldKey: FieldKey,
  sourceLocale: string,
  targetLocale: string,
  context?: TranslationContext
) {
  const common = [
    getLocaleCodeRules(sourceLocale, targetLocale),
    getBrandTranslationRules(),
    getContextRules(context),
    "Before translating, infer the intended meaning of the source text in the context of an app store listing.",
    "If the source wording is short, ambiguous, elliptical, or could be interpreted in multiple ways, resolve it to the most natural intended meaning first, then translate that meaning.",
    "Do not translate mechanically word-for-word.",
    "Do not add unsupported facts.",
    `The source language is ${sourceLocale}. The target language is ${targetLocale}.`,
    "If the source text contains mixed-language fragments, borrowed words, decorative symbols, bullets, unusual formatting, partially localized wording, tabs, separators, arrows, slashes, or similar notation, first internally restate it as natural text in the source language only, without changing the meaning, and then translate that cleaned source meaning into the target language.",
    "When symbols or list markers are not semantically important, ignore them during meaning resolution.",
    "This internal source-language cleanup is mandatory when the source mixes languages or formatting noise.",
    "Do not preserve mixed-language source artifacts just because they appear in the original input.",
    "Do not preserve English just because it looks short or title-like.",
  ];

  if (
    fieldKey === "title" ||
    fieldKey === "subtitle" ||
    fieldKey === "promotionalText" ||
    fieldKey === "iapDisplayName" ||
    fieldKey === "iapDescription" ||
    fieldKey === "subscriptionGroupDisplayName" ||
    fieldKey === "subscriptionCustomName"
  ) {
    common.push(
      "For short store text, prioritize natural, compact target-language wording over literal translation.",
      "If necessary, compress the meaning naturally instead of preserving every source detail."
    );
  }

  return common.filter(Boolean).join(" ");
}

function getConsistencyRules() {
  return [
    "Identify the main concepts and entities in the source text and keep each one translated consistently within the output.",
    "If the same source phrase appears multiple times inside the same field, translate it consistently.",
    "Do not switch between different animals, objects, roles, product concepts, or place types for the same source term.",
    "If the source contains a rare species, fictional concept, compound noun, culturally specific term, app name, game name, product name, series name, or subscription name, infer the intended referent carefully and keep that referent stable.",
    "Do not replace a specific source referent with a broader, different, or unrelated category.",
    "If a title-like name is translated, keep that translated name consistent throughout the same output.",
  ].join(" ");
}

function getLanguagePurityRules(targetLocale: string) {
  const rules = [
    "Output must be fully written in the target language.",
    "Translate all meaningful source words into the target language as naturally as possible.",
    "Do not intentionally leave English words or source-language words untranslated.",
    "Do not preserve English just because it looks short or title-like.",
    "Do not preserve app names, game names, product names, or title-like phrases merely because they look like brands.",
    "Game genre words and store genre expressions should also be translated naturally when the target language has a natural expression for them.",
    "Locale codes must be followed exactly.",
    "Do not infer a different language from the country or region part of a locale code.",
    "en-CA means Canadian English, not French Canadian.",
    "fr-CA means Canadian French. en-CA must be written in English.",
  ];

  if (targetLocale !== "ja") {
    rules.push("Do not leave Japanese text in the output.");
  }

  if (!targetLocale.startsWith("en")) {
    rules.push(
      "Do not leave generic English words in the output.",
      "For non-English target locales, translate meaningful English words in app names, game names, product names, game genre expressions, store genre expressions, and title-like phrases unless they are URLs, @handles, email addresses, domains, technical identifiers, platform names, API names, or official untranslatable proper nouns."
    );
  }

  if (targetLocale.startsWith("en")) {
    rules.push("The output language must be English.");
  }

  if (targetLocale === "en-CA") {
    rules.push(
      "The output must be Canadian English.",
      "Do not write French for en-CA.",
      "Do not use Canadian French for en-CA."
    );
  }

  return rules.join(" ");
}

function getGarbagePreventionRules(fieldKey: FieldKey) {
  if (!shouldAutoCleanGarbage(fieldKey)) return "";

  return [
    "Return plain text only.",
    "Do not add decorative symbols, brackets, bullets, markers, or closing symbols that are not present in the source meaning.",
    "Do not append stray characters such as 】, 〕, ］, 》, 」, 』, or similar symbols.",
    "Do not leave orphan closing punctuation or unmatched brackets at the end.",
    "The output must end naturally with normal text or normal punctuation only.",
  ].join(" ");
}

function getNumericIntegrityRules() {
  return [
    "Do not change numeric quantity or magnitude from the source.",
    "Any number, count, frequency, duration, interval, ranking, threshold, or amount in the source must keep the same underlying value in the output.",
    "You may localize notation, digit grouping, separators, and unit wording naturally for the target language.",
    "You may convert how the number is written, but not what amount it represents.",
    "For example, 1,000,000 may be localized in wording, but it must still mean one million.",
    "Do not inflate, round up, round down, approximate, or otherwise alter numeric magnitude unless the source itself is approximate.",
  ].join(" ");
}

function getFieldSpecificRules(
  fieldKey: FieldKey,
  limit: number,
  targetLocale: string
) {
  switch (fieldKey) {
    case "title":
      return [
        "This is an app title.",
        "Translate it as a natural app title.",
        "Translate all meaningful words in the title.",
        "Do not preserve English just because it looks short or title-like.",
        "Do not preserve app names, game names, product names, or title-like phrases merely because they look like brands.",
        "If the source title is English and the target locale is also English, keep the exact source title unchanged.",
        "For es-ES and es-MX titles, use the same neutral Spanish title.",
        "For pt-BR and pt-PT titles, use the same neutral Portuguese title.",
        "If the limit is tight, prioritize a natural title first; only drop secondary detail if needed.",
        "Make it read like a real mobile app title, not a sentence.",
        "Keep it concise, memorable, and store-friendly.",
        "Shortness is critical.",
        "Do not add a question mark unless the source title clearly uses one.",
        "Do not add words like app, game, simulator, translated, official, best, or new unless clearly required by the source.",
        "If the source is creative, fictional, branded, title-like, or product-like, still translate its meaningful parts naturally instead of leaving them in the source language.",
        "Do not turn the title into a descriptive sentence.",
        "If a source expression is generic, descriptive, camelCase, snake_case, kebab-case, title case, or plain words, translate it naturally.",
        "Split merged words naturally when needed before translating.",
        getTitleLocaleConsistencyRule(targetLocale),
        `Must fit within ${limit} characters.`,
      ]
        .filter(Boolean)
        .join(" ");

    case "subtitle":
      return [
        "This is an app subtitle.",
        "Translate it as a natural app subtitle.",
        "Translate all meaningful words naturally.",
        "Translate game genre expressions naturally instead of preserving English when the target language has a natural expression.",
        "Do not preserve English just because it looks short or title-like.",
        "Do not preserve app names, game names, product names, or title-like phrases merely because they look like brands.",
        "Make it concise, natural, and store-friendly.",
        "Shortness is critical.",
        "If the limit is tight, first create the most natural short store subtitle within the limit, even if the source details must be summarized.",
        "Do not force two separate source elements into the first shortened version if that makes the result unnatural.",
        "Do not add a question mark unless the source subtitle clearly uses one.",
        "Prefer benefit-oriented wording over literal translation.",
        `Must fit within ${limit} characters.`,
      ].join(" ");

    case "promotionalText":
      return [
        "This is promotional text for an app store listing.",
        "Make it appealing and natural.",
        "Translate all meaningful words naturally.",
        "Translate game genre expressions naturally instead of preserving English when the target language has a natural expression.",
        "Do not preserve English just because it looks short or title-like.",
        "Do not preserve app names, game names, product names, or title-like phrases merely because they look like brands.",
        "Keep the meaning, but it may be lightly marketing-optimized.",
        `Must fit within ${limit} characters.`,
      ].join(" ");

    case "description":
      return [
        "This is a store description.",
        "Keep it natural and readable.",
        "Translate all meaningful words naturally throughout the description.",
        "Translate game genre expressions naturally instead of preserving English when the target language has a natural expression.",
        "Do not preserve English just because it looks short or title-like.",
        "Do not preserve app names, game names, product names, or title-like phrases merely because they look like brands.",
        "If the exact source title or main app name appears in the description, translate it consistently with the translated title for the same target language when provided.",
        "For related series titles, related game names, sequel names, or spin-off names, translate them naturally as complete names. Do not mechanically combine the translated main title with the remaining words.",
        "Preserve the structure if possible.",
        "If the source contains URLs, preserve them exactly as written.",
        `Must fit within ${limit} characters.`,
      ].join(" ");

    case "keywords":
      return [
        "This is an App Store keyword field.",
        "Return only comma-separated keywords.",
        "No hashtags, no bullets, no full sentences.",
        "Keep it concise and relevant.",
        "Translate generic terms naturally.",
        "Translate game genre expressions naturally instead of preserving English when the target language has a natural keyword expression.",
        "Translate all meaningful keywords unless they are fixed URLs, @handles, domains, technical identifiers, platform names, API names, or official untranslatable proper nouns.",
        "Do not preserve English just because it looks short or title-like.",
        "Do not preserve app names, game names, product names, or title-like phrases merely because they look like brands.",
        "Do not include broken fragments, malformed tokens, braces, or backslashes.",
        `Must fit within ${limit} characters.`,
      ].join(" ");

    case "whatsNew":
      return [
        "This is a 'What's New' field for an app update.",
        "Make it natural for release notes.",
        "Translate all meaningful words naturally.",
        "Translate game genre expressions naturally instead of preserving English when the target language has a natural expression.",
        "Do not preserve English just because it looks short or title-like.",
        "Do not preserve app names, game names, product names, or title-like phrases merely because they look like brands.",
        "Prefer short release-note style, but return plain text only.",
        "If the source contains URLs, preserve them exactly as written.",
        `Must fit within ${limit} characters.`,
      ].join(" ");

    case "iapDisplayName":
      return [
        "This is an in-app purchase display name.",
        "Translate it as a natural in-app purchase display name.",
        "Translate all meaningful words naturally.",
        "Do not preserve English just because it looks short or title-like.",
        "Do not preserve app names, game names, product names, subscription names, or title-like phrases merely because they look like brands.",
        "Make it concise, clear, and natural for an app store purchase label.",
        "It should read like a short product name, not a sentence.",
        "Shortness is critical.",
        "If the limit is tight, first create the most natural short purchase label within the limit.",
        "Do not add unnecessary extra words.",
        `Must fit within ${limit} characters.`,
      ].join(" ");

    case "iapDescription":
      return [
        "This is an in-app purchase description.",
        "Make it concise, clear, and natural for an app store purchase description.",
        "Translate all meaningful words naturally.",
        "Do not preserve English just because it looks short or title-like.",
        "Do not preserve app names, game names, product names, subscription names, or title-like phrases merely because they look like brands.",
        "It should explain the purchase briefly and naturally.",
        "Do not make it sound like long marketing copy.",
        `Must fit within ${limit} characters.`,
      ].join(" ");

    case "subscriptionGroupDisplayName":
      return [
        "This is a subscription group display name in App Store Connect.",
        "Make it concise, clear, and natural.",
        "Translate all meaningful words naturally.",
        "Do not preserve English just because it looks short or title-like.",
        "Do not preserve app names, game names, product names, subscription names, or title-like phrases merely because they look like brands.",
        "It should read like a group label, not a sentence.",
        "Do not add unnecessary marketing language.",
        `Must fit within ${limit} characters.`,
      ].join(" ");

    case "subscriptionCustomName":
      return [
        "This is a custom subscription display name in App Store Connect.",
        "Make it concise, clear, and natural.",
        "Translate all meaningful words naturally.",
        "Do not preserve English just because it looks short or title-like.",
        "Do not preserve app names, game names, product names, subscription names, or title-like phrases merely because they look like brands.",
        "It should read like a short subscription name, not a sentence.",
        "Shortness is critical.",
        "If the limit is tight, first create the most natural short subscription name within the limit.",
        "Do not add unnecessary extra words.",
        `Must fit within ${limit} characters.`,
      ].join(" ");

    default:
      return `Must fit within ${limit} characters.`;
  }
}

async function callModel(instructions: string, input: string) {
  const response = await client.responses.create({
    model: "gpt-5.4",
    instructions,
    input,
  });

  return normalizeOutput(response.output_text ?? "");
}

function stripNonLetterForScriptCheck(text: string) {
  return text.replace(/[^\p{L}]/gu, "");
}

function hasBrokenEnding(fieldKey: FieldKey, text: string) {
  if (!text) return false;

  if (
    !(
      fieldKey === "title" ||
      fieldKey === "subtitle" ||
      fieldKey === "promotionalText"
    )
  ) {
    return false;
  }

  const trimmed = text.trim();

  return /(?:\b(?:a|an|and|as|at|by|da|de|del|des|di|do|e|em|en|et|for|from|in|into|of|on|or|para|por|the|to|with|y)$|[({\[/\\\-])$/i.test(
    trimmed
  );
}

function detectExpectedScriptGroup(targetLocale: string) {
  if (targetLocale === "ar-SA") return "arabic";
  if (targetLocale === "he") return "hebrew";
  if (targetLocale === "ru" || targetLocale === "uk") return "cyrillic";
  if (targetLocale === "ko") return "hangul";
  if (targetLocale === "zh-Hans" || targetLocale === "zh-Hant") return "han";
  if (targetLocale === "ja") return "japanese";
  return "latin";
}

function hasWrongScriptLeak(targetLocale: string, text: string) {
  if (!text) return false;

  const lettersOnly = stripNonLetterForScriptCheck(text);
  if (!lettersOnly) return false;

  const group = detectExpectedScriptGroup(targetLocale);

  if (group === "japanese") {
    return (
      ARABIC_RE.test(lettersOnly) ||
      HEBREW_RE.test(lettersOnly) ||
      CYRILLIC_RE.test(lettersOnly) ||
      HANGUL_RE.test(lettersOnly)
    );
  }

  if (group === "han") {
    return (
      KANA_RE.test(lettersOnly) ||
      ARABIC_RE.test(lettersOnly) ||
      HEBREW_RE.test(lettersOnly) ||
      CYRILLIC_RE.test(lettersOnly) ||
      HANGUL_RE.test(lettersOnly)
    );
  }

  if (group === "arabic") {
    return (
      KANA_RE.test(lettersOnly) ||
      HAN_RE.test(lettersOnly) ||
      HEBREW_RE.test(lettersOnly) ||
      CYRILLIC_RE.test(lettersOnly) ||
      HANGUL_RE.test(lettersOnly)
    );
  }

  if (group === "hebrew") {
    return (
      KANA_RE.test(lettersOnly) ||
      HAN_RE.test(lettersOnly) ||
      ARABIC_RE.test(lettersOnly) ||
      CYRILLIC_RE.test(lettersOnly) ||
      HANGUL_RE.test(lettersOnly)
    );
  }

  if (group === "cyrillic") {
    return (
      KANA_RE.test(lettersOnly) ||
      HAN_RE.test(lettersOnly) ||
      ARABIC_RE.test(lettersOnly) ||
      HEBREW_RE.test(lettersOnly) ||
      HANGUL_RE.test(lettersOnly)
    );
  }

  if (group === "hangul") {
    return (
      KANA_RE.test(lettersOnly) ||
      HAN_RE.test(lettersOnly) ||
      ARABIC_RE.test(lettersOnly) ||
      HEBREW_RE.test(lettersOnly) ||
      CYRILLIC_RE.test(lettersOnly)
    );
  }

  return (
    KANA_RE.test(lettersOnly) ||
    HAN_RE.test(lettersOnly) ||
    ARABIC_RE.test(lettersOnly) ||
    HEBREW_RE.test(lettersOnly) ||
    CYRILLIC_RE.test(lettersOnly) ||
    HANGUL_RE.test(lettersOnly)
  );
}

function hasSuspiciousTrailingGarbage(fieldKey: FieldKey, text: string) {
  if (!shouldAutoCleanGarbage(fieldKey) || !text) return false;

  const trimmed = text.trim();

  return (
    SUSPICIOUS_TRAILING_GARBAGE_RE.test(trimmed) ||
    SUSPICIOUS_ORPHAN_GARBAGE_RE.test(trimmed)
  );
}

function cleanupSuspiciousTrailingGarbage(fieldKey: FieldKey, text: string) {
  if (!shouldAutoCleanGarbage(fieldKey) || !text) {
    return {
      text,
      changed: false,
    };
  }

  let cleaned = text.trimEnd();
  const before = cleaned;

  cleaned = cleaned.replace(SUSPICIOUS_TRAILING_GARBAGE_RE, "").trimEnd();
  cleaned = cleaned.replace(SUSPICIOUS_ORPHAN_GARBAGE_RE, "$1").trimEnd();

  return {
    text: cleaned,
    changed: cleaned !== before,
  };
}

function validateOutput(params: {
  fieldKey: FieldKey;
  targetLocale: string;
  text: string;
  limit: number;
}) {
  const { fieldKey, targetLocale, text, limit } = params;
  const issues: string[] = [];

  if (!text) {
    issues.push("Output is empty.");
    return issues;
  }

  if (countChars(text) > limit && fieldKey !== "keywords") {
    issues.push(`Output exceeds ${limit} characters.`);
  }

  if (hasWrongScriptLeak(targetLocale, text)) {
    issues.push(
      "Output contains unrelated foreign-language text or an unexpected script."
    );
  }

  if (hasBrokenEnding(fieldKey, text)) {
    issues.push("Output appears truncated or ends unnaturally.");
  }

  if (hasSuspiciousTrailingGarbage(fieldKey, text)) {
    issues.push("Output contains suspicious trailing garbage characters.");
  }

  if (fieldKey === "keywords") {
    if (/[{}[\]\\`]/.test(text)) {
      issues.push("Keywords contain malformed symbols.");
    }

    const tokens = text
      .replace(/，/g, ",")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      issues.push("Keywords are empty.");
    }

    if (tokens.some((x) => x.length <= 1)) {
      issues.push("Keywords contain broken fragments.");
    }
  }

  return issues;
}

function getFatalReasons(params: {
  fieldKey: FieldKey;
  targetLocale: string;
  text: string;
  limit: number;
}) {
  const { fieldKey, targetLocale, text, limit } = params;

  const reasons = {
    empty: !text,
    overLimit: countChars(text) > limit && fieldKey !== "keywords",
    wrongScript: hasWrongScriptLeak(targetLocale, text),
    brokenEnding: hasBrokenEnding(fieldKey, text),
    garbageEnding: hasSuspiciousTrailingGarbage(fieldKey, text),
    keywordMalformed: false,
    keywordEmpty: false,
  };

  if (fieldKey === "keywords") {
    reasons.keywordMalformed = /[{}[\]\\`]/.test(text);

    const tokens = text
      .replace(/，/g, ",")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    reasons.keywordEmpty = tokens.length === 0;
  }

  return reasons;
}

function hasFatalIssue(params: {
  fieldKey: FieldKey;
  targetLocale: string;
  text: string;
  limit: number;
}) {
  const reasons = getFatalReasons(params);

  return (
    reasons.empty ||
    reasons.overLimit ||
    reasons.wrongScript ||
    reasons.brokenEnding ||
    reasons.garbageEnding ||
    reasons.keywordMalformed ||
    reasons.keywordEmpty
  );
}

async function hasMeaningDrift(params: {
  sourceLocale: string;
  targetLocale: string;
  fieldKey: FieldKey;
  sourceText: string;
  translatedText: string;
  context?: TranslationContext;
}) {
  if (params.fieldKey === "keywords") {
    return false;
  }

  const baseInstructions = [
    "You are a strict translation reviewer.",
    "Return only OK or NG.",
    "Judge whether the translated text preserves the same core meaning as the source.",
    "Focus especially on creature/species, object, place type, gameplay concept, and numeric quantity.",
    "If a specific animal/species became a different animal or a broader/different category, return NG.",
    "If a core object, role, or place type changed into a different category, return NG.",
    "If numeric quantity or magnitude changed, return NG.",
    "Localized numeric notation or localized unit wording is allowed only when the underlying amount stays the same.",
    "If the translation keeps the same essential referent, gameplay meaning, and numeric quantity, return OK.",
    "A meaningful app name, game name, product name, subscription name, or title-like phrase may be translated into the target language.",
    "Do not mark NG merely because an app name, game name, product name, subscription name, or title-like phrase was translated instead of preserved.",
    "Do not require English brand-looking names to remain English when their words have meaning.",
    "If cross-field name context is provided, do not mark NG merely because the translated text uses that translated title consistently.",
    "Do not mark NG merely because a related series title or related game name was translated naturally instead of being mechanically based on the main translated title.",
    "URLs, @handles, email addresses, domains, technical identifiers, platform names, and API names may remain unchanged.",
    "Locale codes must be followed exactly.",
    "en-CA means Canadian English, not French Canadian.",
    "Do not mark NG merely because en-CA is written in English.",
  ];

  if (
    params.fieldKey === "subtitle" ||
    params.fieldKey === "iapDisplayName" ||
    params.fieldKey === "title" ||
    params.fieldKey === "subscriptionCustomName"
  ) {
    baseInstructions.push(
      "For short store text, allow compact paraphrase and omission of secondary detail if the core app concept is preserved."
    );
  }

  if (
    params.fieldKey === "description" ||
    params.fieldKey === "promotionalText"
  ) {
    baseInstructions.push("Do not mark NG for stylistic paraphrase alone.");
  }

  const res = await callModel(
    baseInstructions.join(" "),
    [
      `Source locale: ${params.sourceLocale}`,
      `Target locale: ${params.targetLocale}`,
      `Field: ${params.fieldKey}`,
      "",
      params.context?.sourceTitle && params.context?.translatedTitle
        ? [
            "Cross-field name context:",
            `Source app title: ${params.context.sourceTitle}`,
            `Translated app title: ${params.context.translatedTitle}`,
            "",
          ].join("\n")
        : "",
      "Source text:",
      params.sourceText,
      "",
      "Translated text:",
      params.translatedText,
    ].join("\n")
  );

  return res.trim() === "NG";
}

async function hasNaturalnessIssue(params: {
  sourceLocale: string;
  targetLocale: string;
  fieldKey: FieldKey;
  sourceText: string;
  translatedText: string;
  context?: TranslationContext;
}) {
  if (params.fieldKey === "keywords") {
    return false;
  }

  const instructions = [
    "You are a strict App Store localization quality reviewer.",
    "Return only OK or NG.",
    "Judge whether the translated text is natural, fluent, and store-appropriate in the target language.",
    "This check is especially for text that was shortened, rewritten, repaired, or compressed to fit a character limit.",
    "Return NG if it sounds awkward, overly literal, broken, truncated, unnatural, or not like real store listing text.",
    "Return NG if a short title, subtitle, IAP name, or subscription name is too clipped to work as a natural store phrase.",
    "Return NG if a related series title or related game name is mechanically built from the translated main title and sounds unnatural.",
    "Return NG if game genre expressions or store genre expressions are left in English when the target language has a natural expression.",
    "Return NG if meaningful English words remain in a non-English target locale, unless they are URLs, @handles, email addresses, domains, technical identifiers, platform names, API names, or official untranslatable proper nouns.",
    "Return OK if the text is concise but still natural and preserves the core meaning.",
    "Do not penalize compact wording merely because it is shorter than the source.",
    "Do not penalize URLs, @handles, email addresses, domains, platform names, or technical identifiers that remain unchanged.",
    "Locale codes must be followed exactly.",
    "en-CA means Canadian English, not French Canadian.",
  ];

  const res = await callModel(
    instructions.join(" "),
    [
      `Source locale: ${params.sourceLocale}`,
      `Target locale: ${params.targetLocale}`,
      `Field: ${params.fieldKey}`,
      "",
      params.context?.sourceTitle && params.context?.translatedTitle
        ? [
            "Cross-field name context:",
            `Source app title: ${params.context.sourceTitle}`,
            `Translated app title: ${params.context.translatedTitle}`,
            "",
          ].join("\n")
        : "",
      "Source text:",
      params.sourceText,
      "",
      "Translated text:",
      params.translatedText,
    ].join("\n")
  );

  return res.trim() === "NG";
}

function getRepairInstructions(params: {
  sharedInstructions: string;
  fieldKey: FieldKey;
  targetLocale: string;
  limit: number;
  reasonText: string;
}) {
  const { sharedInstructions, fieldKey, targetLocale, limit, reasonText } =
    params;

  const extra: string[] = [
    sharedInstructions,
    getBrandTranslationRules(),
    "Rewrite naturally and fix all problems.",
    "Keep the same core meaning.",
    "Keep the same numeric quantity and magnitude as the source.",
    "Translate remaining meaningful source-language words into the target language whenever possible.",
    "Do not preserve English just because it looks short or title-like.",
    "Do not preserve app names, game names, product names, subscription names, or title-like phrases merely because they look like brands.",
    "Translate related series titles and related game names naturally as complete names. Do not mechanically combine the translated main title with the remaining words.",
    "Translate game genre expressions naturally instead of preserving English when the target language has a natural expression.",
    "If cross-field title context is provided, use it consistently only where it sounds natural.",
    "Locale codes must be followed exactly.",
    "en-CA means Canadian English, not French Canadian.",
    "fr-CA means Canadian French. en-CA must be written in English.",
    "Must fit the character limit.",
    "Do not leave foreign-language text.",
    "Do not end unnaturally.",
    "Remove any stray decorative or unmatched closing symbols.",
    "Return only the corrected text.",
  ];

  if (shouldPreserveUrls(fieldKey)) {
    extra.push(
      "Preserve every URL exactly as written.",
      "Preserve @handles, email addresses, and domain names exactly as written.",
      "Do not translate, rewrite, shorten, normalize, or remove URLs, @handles, email addresses, or domain names.",
      "Do not use URL preservation as a reason to preserve nearby app names, game names, product names, or title-like phrases."
    );
  }

  if (isShortForceField(fieldKey)) {
    extra.push(
      "First try to make a natural short store phrase within the limit.",
      "Do not force two source elements into the phrase if it makes the result unnatural.",
      "Only if a natural phrase still cannot fit, prioritize the two core meanings or hooks.",
      "If necessary after that, drop secondary detail and keep only the main concept."
    );
  } else {
    extra.push(
      "Do not change the creature/species.",
      "Do not change the core object, role, or place type."
    );
  }

  extra.push(
    `Target locale: ${targetLocale}.`,
    `Character limit: ${limit}.`,
    `Problems to fix: ${reasonText}`
  );

  return extra.join(" ");
}

function getSameLanguageRescueInstructions(params: {
  sharedInstructions: string;
  targetLocale: string;
  fieldKey: FieldKey;
  limit: number;
}) {
  const { sharedInstructions, targetLocale, fieldKey, limit } = params;

  const extra = [
    sharedInstructions,
    getBrandTranslationRules(),
    "This is the final same-language rescue step.",
    "Do not return an empty string.",
    `Write only in ${targetLocale}.`,
    "Do not use any other language.",
    "If cross-field title context is provided, use it consistently only where it sounds natural.",
    "Translate related series titles and related game names naturally as complete names. Do not mechanically combine the translated main title with the remaining words.",
    "Locale codes must be followed exactly.",
    "en-CA means Canadian English, not French Canadian.",
    "fr-CA means Canadian French. en-CA must be written in English.",
    "Translate remaining meaningful source-language words into the target language whenever possible.",
    "Do not preserve English just because it looks short or title-like.",
    "Do not preserve app names, game names, product names, subscription names, or title-like phrases merely because they look like brands.",
    "Translate game genre expressions naturally instead of preserving English when the target language has a natural expression.",
    "Do not leave Japanese text.",
    "Do not leave unrelated English words.",
    "Do not mix scripts from another language.",
    "Do not append decorative symbols or stray closing marks.",
    "Keep numeric quantity and magnitude unchanged.",
    "If needed, simplify aggressively but keep the core meaning.",
    `${fieldKey} must fit within ${limit} characters.`,
  ];

  if (shouldPreserveUrls(fieldKey)) {
    extra.push(
      "Preserve every URL exactly as written.",
      "Preserve @handles, email addresses, and domain names exactly as written.",
      "Do not translate, rewrite, shorten, normalize, or remove URLs, @handles, email addresses, or domain names."
    );
  }

  return extra.join(" ");
}

function getEnglishFallbackInstructions(params: {
  fieldKey: FieldKey;
  limit: number;
}) {
  const { fieldKey, limit } = params;

  const extra = [
    "You are a professional App Store localization translator.",
    "Return only the output text.",
    "Do not add quotes.",
    "Do not add explanations.",
    "Write in natural English only.",
    "Do not return an empty string.",
    "Do not append decorative symbols or stray closing marks.",
    "Keep numeric quantity and magnitude unchanged.",
    `The output must be within ${limit} characters.`,
    "Count spaces, punctuation, symbols, and line breaks as characters.",
    "Preserve the core meaning of the source.",
    "If needed, shorten aggressively.",
    "This is the final fallback.",
    `${fieldKey} must fit within ${limit} characters.`,
  ];

  if (shouldPreserveUrls(fieldKey)) {
    extra.push(
      "If the source contains URLs, preserve every URL exactly as written.",
      "Preserve @handles, email addresses, and domain names exactly as written.",
      "Do not translate, rewrite, shorten, normalize, or remove URLs, @handles, email addresses, or domain names."
    );
  }

  return extra.join(" ");
}

async function tryCreateText(
  instructions: string,
  input: string
): Promise<string> {
  const out = await callModel(instructions, input);
  return normalizeOutput(out);
}

async function generateCandidate(params: {
  sourceLocale: string;
  targetLocale: string;
  fieldKey: FieldKey;
  text: string;
  limit: number;
  instructions: string;
}): Promise<CandidateResult> {
  const { sourceLocale, targetLocale, fieldKey, text, limit, instructions } =
    params;

  let best = "";
  let usedRewrite = false;

  const firstText = await tryCreateText(
    instructions,
    [
      `Task: translate ${fieldKey} from ${sourceLocale} to ${targetLocale}.`,
      "",
      "Source text:",
      text,
    ].join("\n")
  );

  if (firstText) {
    best = firstText;
    if (countChars(firstText) <= limit) {
      return {
        text: firstText,
        usedRewrite: false,
      };
    }
  }

  usedRewrite = true;
  const retrySeed = best || text;

  const retryText = await tryCreateText(
    [
      instructions,
      getBrandTranslationRules(),
      "Rewrite the text so it fits the limit.",
      "Create the most natural short store text within the character limit.",
      "Shorten naturally while preserving the core meaning.",
      "It is acceptable to summarize several source details into one natural phrase.",
      "Do not force two separate source elements into the phrase if that makes the result unnatural.",
      "Translate remaining meaningful source-language words into the target language whenever possible.",
      "Translate related series titles and related game names naturally as complete names. Do not mechanically combine the translated main title with the remaining words.",
      "Translate game genre expressions naturally instead of preserving English when the target language has a natural expression.",
      "Do not preserve English just because it looks short or title-like.",
      "Do not preserve app names, game names, product names, subscription names, or title-like phrases merely because they look like brands.",
      "If cross-field title context is provided, use it consistently only where it sounds natural.",
      "Locale codes must be followed exactly.",
      "en-CA means Canadian English, not French Canadian.",
      "Preserve numeric quantity and magnitude exactly.",
      "Do not return an empty string.",
    ].join(" "),
    [
      `Task: rewrite this ${fieldKey} for ${targetLocale} within ${limit} characters.`,
      "",
      "Current text:",
      retrySeed,
    ].join("\n")
  );

  if (retryText) {
    best = retryText;
    if (countChars(retryText) <= limit) {
      return {
        text: retryText,
        usedRewrite,
      };
    }
  }

  const finalSeed = best || retrySeed;

  const finalText = await tryCreateText(
    [
      instructions,
      getBrandTranslationRules(),
      "Create a shorter natural version that still preserves the essential meaning.",
      "Natural target-language wording is still required.",
      "Translate remaining meaningful source-language words into the target language whenever possible.",
      "Translate related series titles and related game names naturally as complete names. Do not mechanically combine the translated main title with the remaining words.",
      "Translate game genre expressions naturally instead of preserving English when the target language has a natural expression.",
      "Do not preserve English just because it looks short or title-like.",
      "Do not preserve app names, game names, product names, subscription names, or title-like phrases merely because they look like brands.",
      "If cross-field title context is provided, use it consistently only where it sounds natural.",
      "Locale codes must be followed exactly.",
      "en-CA means Canadian English, not French Canadian.",
      "Preserve numeric quantity and magnitude exactly.",
      "For title/subtitle/iapDisplayName/subscriptionCustomName, now prioritize the two core meanings if possible.",
      "If needed for short fields, omit secondary detail.",
      "Do not return an empty string.",
    ].join(" "),
    [
      `Task: make this ${fieldKey} fit within ${limit} characters in ${targetLocale}.`,
      "",
      "Current text:",
      finalSeed,
    ].join("\n")
  );

  if (finalText) {
    best = finalText;
    if (countChars(finalText) <= limit) {
      return {
        text: finalText,
        usedRewrite,
      };
    }
  }

  const rescueText = await tryCreateText(
    [
      instructions,
      getBrandTranslationRules(),
      "Do not return an empty string.",
      "Return the safest natural translation possible within the limit.",
      "Translate remaining meaningful source-language words into the target language whenever possible.",
      "Translate related series titles and related game names naturally as complete names. Do not mechanically combine the translated main title with the remaining words.",
      "Translate game genre expressions naturally instead of preserving English when the target language has a natural expression.",
      "Do not preserve English just because it looks short or title-like.",
      "Do not preserve app names, game names, product names, subscription names, or title-like phrases merely because they look like brands.",
      "If cross-field title context is provided, use it consistently only where it sounds natural.",
      "Locale codes must be followed exactly.",
      "en-CA means Canadian English, not French Canadian.",
      "Preserve numeric quantity and magnitude exactly.",
      "If needed, prioritize the two core meanings, then sacrifice secondary detail.",
      "The result must still be based on the source text in this request.",
    ].join(" "),
    [
      `Task: produce a non-empty ${fieldKey} in ${targetLocale} within ${limit} characters.`,
      "",
      "Source text:",
      text,
    ].join("\n")
  );

  if (rescueText) {
    return {
      text: rescueText,
      usedRewrite,
    };
  }

  if (best) {
    return {
      text: best,
      usedRewrite,
    };
  }

  throw new Error("No translated text returned");
}

async function buildEnglishFallback(params: {
  fieldKey: FieldKey;
  limit: number;
  text: string;
}): Promise<string> {
  const { fieldKey, limit, text } = params;

  const englishFallback = await tryCreateText(
    getEnglishFallbackInstructions({ fieldKey, limit }),
    [
      `Task: translate this ${fieldKey} into concise English within ${limit} characters.`,
      "",
      "Source text:",
      text,
    ].join("\n")
  );

  if (englishFallback) {
    return finalizeFieldText(fieldKey, englishFallback, limit);
  }

  const deterministicFallback =
    fieldKey === "keywords"
      ? trimKeywordsToLimit(text, limit) ||
        trimKeywordsToLimit("temporary", limit)
      : hardClip(text, limit) || hardClip("Temporary fallback", limit);

  return deterministicFallback;
}

export async function translateWithinLimit(params: {
  sourceLocale: string;
  targetLocale: string;
  fieldKey: FieldKey;
  text: string;
  limit: number;
  context?: TranslationContext;
}): Promise<TranslationResult> {
  const { sourceLocale, targetLocale, fieldKey, text, limit, context } = params;

  if (
    shouldReturnSourceTitle({
      sourceLocale,
      targetLocale,
      fieldKey,
      text,
      limit,
    })
  ) {
    return {
      text: normalizeOutput(text),
      warning: false,
      error: false,
    };
  }

  const localeRules = getLocaleCodeRules(sourceLocale, targetLocale);
  const brandRules = getBrandTranslationRules();
  const contextRules = getContextRules(context);
  const meaningRules = getMeaningResolutionRules(
    fieldKey,
    sourceLocale,
    targetLocale,
    context
  );
  const consistencyRules = getConsistencyRules();
  const purityRules = getLanguagePurityRules(targetLocale);
  const fieldRules = getFieldSpecificRules(fieldKey, limit, targetLocale);
  const urlRules = getUrlPreservationRules(fieldKey);
  const garbageRules = getGarbagePreventionRules(fieldKey);
  const numericRules = getNumericIntegrityRules();

  const sharedInstructions = [
    "You are a professional App Store and Google Play localization translator.",
    localeRules,
    brandRules,
    contextRules,
    "Return only the output text.",
    "Do not add quotes.",
    "Do not add explanations.",
    "Keep the style natural for store listing text.",
    `The output must be within ${limit} characters.`,
    "Count spaces, punctuation, symbols, and line breaks as characters.",
    "Preserve the core meaning of the source.",
    "If needed, shorten naturally while keeping the original intent.",
    "Write naturally in the target language.",
    "Locale codes must be followed exactly.",
    "Do not infer a different language from the country or region part of a locale code.",
    "en-CA means Canadian English, not French Canadian.",
    "fr-CA means Canadian French. en-CA must be written in English.",
    "Translate meaningful source words into the target language.",
    "Do not intentionally leave source-language words untranslated.",
    "Do not preserve English just because it looks short or title-like.",
    "Do not preserve app names, game names, product names, subscription names, or title-like phrases merely because they look like brands.",
    "Translate related series titles and related game names naturally as complete names. Do not mechanically combine the translated main title with the remaining words.",
    "Translate game genre expressions naturally instead of preserving English when the target language has a natural expression.",
    "Generic expressions must be translated.",
    "camelCase, PascalCase, snake_case, kebab-case, hashtags, concatenated words, and awkward source formatting are not evidence that words should stay untranslated.",
    "If a phrase looks like generic source text written without spaces, mentally split it into natural words and translate the meaning.",
    "If the source text contains mixed-language fragments, decorative symbols, bullets, partial localization, abbreviations from another language, or formatting noise, first internally rewrite it as natural text in the source language only, without changing the meaning, and then translate that cleaned source meaning into the target language.",
    "When symbols or list markers such as bullets, decorative marks, separators, arrows, slashes, tabs, numbering marks, or similar notation are not semantically important, ignore them during meaning resolution and do not treat them as foreign-language leakage.",
    "Never expose or mention the internal rewrite step in the output.",
    "Prefer a natural target-language expression over copying the source wording.",
    "Do not replace the core noun, creature, object, place type, or gameplay concept with a different one.",
    "Do not replace a specific animal/species with a different animal or a broader category.",
    "Do not replace a core object, role, or place type with a different category.",
    "For title/subtitle/iapDisplayName/subscriptionCustomName, first prioritize natural compact wording within the limit.",
    "Only if natural compact wording still cannot fit, prioritize the two core meanings and drop secondary detail.",
    "Never return an empty string for any field when the source text is non-empty.",
    urlRules,
    garbageRules,
    numericRules,
    meaningRules,
    consistencyRules,
    purityRules,
    fieldRules,
  ]
    .filter(Boolean)
    .join(" ");

  const candidate = await generateCandidate({
    sourceLocale,
    targetLocale,
    fieldKey,
    text,
    limit,
    instructions: sharedInstructions,
  });

  let best = finalizeFieldText(fieldKey, candidate.text, limit);
  let usedRewrite = candidate.usedRewrite;

  const firstCleanup = cleanupSuspiciousTrailingGarbage(fieldKey, best);
  if (firstCleanup.changed) {
    usedRewrite = true;
    best = finalizeFieldText(fieldKey, firstCleanup.text, limit);
  }

  const MAX_REPAIR_ATTEMPTS = isThirtyCharField(fieldKey) ? 3 : 2;

  for (let i = 0; i < MAX_REPAIR_ATTEMPTS; i += 1) {
    const issues = validateOutput({
      fieldKey,
      targetLocale,
      text: best,
      limit,
    });

    const drift =
      fieldKey !== "keywords" &&
      (await hasMeaningDrift({
        sourceLocale,
        targetLocale,
        fieldKey,
        sourceText: text,
        translatedText: best,
        context,
      }));

    const fatal = hasFatalIssue({
      fieldKey,
      targetLocale,
      text: best,
      limit,
    });

    if (!fatal && !drift && issues.length === 0) {
      const naturalnessIssue =
        usedRewrite &&
        (await hasNaturalnessIssue({
          sourceLocale,
          targetLocale,
          fieldKey,
          sourceText: text,
          translatedText: best,
          context,
        }));

      return {
        text: finalizeFieldText(fieldKey, best, limit),
        warning:
          naturalnessIssue ||
          hasUnexpectedEnglishWordsWarning(targetLocale, best),
        error: false,
      };
    }

    const rewritten = await tryCreateText(
      getRepairInstructions({
        sharedInstructions,
        fieldKey,
        targetLocale,
        limit,
        reasonText: [
          `fatal: ${fatal}`,
          `meaningDrift: ${drift}`,
          ...issues,
        ].join(", "),
      }),
      [
        `Task: rewrite this ${fieldKey} in ${targetLocale} within ${limit} characters.`,
        "",
        context?.sourceTitle && context?.translatedTitle
          ? [
              "Cross-field name context:",
              `Source app title: ${context.sourceTitle}`,
              `Translated app title: ${context.translatedTitle}`,
              "",
            ].join("\n")
          : "",
        "Source text:",
        text,
        "",
        "Current output:",
        best,
        "",
        "Problems:",
        `- fatal: ${fatal}`,
        `- meaningDrift: ${drift}`,
        ...issues.map((x) => `- ${x}`),
      ].join("\n")
    );

    if (rewritten) {
      usedRewrite = true;
      best = finalizeFieldText(fieldKey, rewritten, limit);

      const cleaned = cleanupSuspiciousTrailingGarbage(fieldKey, best);
      if (cleaned.changed) {
        best = finalizeFieldText(fieldKey, cleaned.text, limit);
      }
    }
  }

  if (isShortForceField(fieldKey) && (!best || countChars(best) > limit)) {
    const ultraShort = await tryCreateText(
      [
        sharedInstructions,
        getBrandTranslationRules(),
        "Create an ultra-short natural store text.",
        "Natural target-language wording is still required.",
        "Prioritize the two core meanings.",
        "Translate remaining meaningful source-language words into the target language whenever possible.",
        "Translate related series titles and related game names naturally as complete names. Do not mechanically combine the translated main title with the remaining words.",
        "Translate game genre expressions naturally instead of preserving English when the target language has a natural expression.",
        "Do not preserve English just because it looks short or title-like.",
        "Do not preserve app names, game names, product names, subscription names, or title-like phrases merely because they look like brands.",
        "If cross-field title context is provided, use it consistently only where it sounds natural.",
        "Locale codes must be followed exactly.",
        "en-CA means Canadian English, not French Canadian.",
        "Preserve numeric quantity and magnitude exactly.",
        "If necessary, keep only the strongest main concept.",
        "Do not return an empty string.",
      ].join(" "),
      [
        `Task: create the shortest possible ${fieldKey} in ${targetLocale} within ${limit} characters.`,
        "",
        context?.sourceTitle && context?.translatedTitle
          ? [
              "Cross-field name context:",
              `Source app title: ${context.sourceTitle}`,
              `Translated app title: ${context.translatedTitle}`,
              "",
            ].join("\n")
          : "",
        "Source text:",
        text,
      ].join("\n")
    );

    if (ultraShort) {
      usedRewrite = true;
      best = finalizeFieldText(fieldKey, ultraShort, limit);

      const cleaned = cleanupSuspiciousTrailingGarbage(fieldKey, best);
      if (cleaned.changed) {
        best = finalizeFieldText(fieldKey, cleaned.text, limit);
      }
    }
  }

  if (!best || hasWrongScriptLeak(targetLocale, best)) {
    const sameLanguageRescue = await tryCreateText(
      getSameLanguageRescueInstructions({
        sharedInstructions,
        targetLocale,
        fieldKey,
        limit,
      }),
      [
        `Task: rewrite this ${fieldKey} using only ${targetLocale}.`,
        "",
        context?.sourceTitle && context?.translatedTitle
          ? [
              "Cross-field name context:",
              `Source app title: ${context.sourceTitle}`,
              `Translated app title: ${context.translatedTitle}`,
              "",
            ].join("\n")
          : "",
        "Source text:",
        text,
        "",
        "Current output:",
        best || "(empty)",
      ].join("\n")
    );

    if (sameLanguageRescue) {
      usedRewrite = true;
      best = finalizeFieldText(fieldKey, sameLanguageRescue, limit);

      const cleaned = cleanupSuspiciousTrailingGarbage(fieldKey, best);
      if (cleaned.changed) {
        best = finalizeFieldText(fieldKey, cleaned.text, limit);
      }
    }
  }

  const finalIssues = validateOutput({
    fieldKey,
    targetLocale,
    text: best,
    limit,
  });

  const finalDrift =
    fieldKey !== "keywords" &&
    (await hasMeaningDrift({
      sourceLocale,
      targetLocale,
      fieldKey,
      sourceText: text,
      translatedText: best,
      context,
    }));

  const naturalnessIssue =
    usedRewrite &&
    (await hasNaturalnessIssue({
      sourceLocale,
      targetLocale,
      fieldKey,
      sourceText: text,
      translatedText: best,
      context,
    }));

  const fatalReasons = getFatalReasons({
    fieldKey,
    targetLocale,
    text: best,
    limit,
  });

  const fatal =
    fatalReasons.empty ||
    fatalReasons.overLimit ||
    fatalReasons.wrongScript ||
    fatalReasons.brokenEnding ||
    fatalReasons.garbageEnding ||
    fatalReasons.keywordMalformed ||
    fatalReasons.keywordEmpty;

  console.log("TRANSLATE_FINAL_CHECK", {
    sourceLocale,
    targetLocale,
    fieldKey,
    limit,
    sourceText: text,
    context,
    best,
    bestLength: countChars(best),
    usedRewrite,
    naturalnessIssue,
    finalIssues,
    finalDrift,
    englishWordWarning: hasUnexpectedEnglishWordsWarning(targetLocale, best),
    fatal,
    fatalReasons,
  });

  if (!fatal) {
    return {
      text: finalizeFieldText(fieldKey, best, limit),
      warning:
        naturalnessIssue ||
        !!finalDrift ||
        finalIssues.length > 0 ||
        hasUnexpectedEnglishWordsWarning(targetLocale, best),
      error: false,
    };
  }

  console.log("TRANSLATE_FALLBACK_TO_ENGLISH", {
    sourceLocale,
    targetLocale,
    fieldKey,
    sourceText: text,
    context,
    best,
    usedRewrite,
    naturalnessIssue,
    englishWordWarning: hasUnexpectedEnglishWordsWarning(targetLocale, best),
    fatalReasons,
    finalIssues,
    finalDrift,
  });

  const fallbackText = await buildEnglishFallback({
    fieldKey,
    limit,
    text,
  });

  return {
    text: fallbackText,
    warning: false,
    error: true,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Body>;
    const sourceLocale =
      typeof body.sourceLocale === "string" ? body.sourceLocale.trim() : "";
    const targetLocale =
      typeof body.targetLocale === "string" ? body.targetLocale.trim() : "";
    const fieldKey = body.fieldKey;
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not set" },
        { status: 500 }
      );
    }

    if (!sourceLocale || !targetLocale || !fieldKey || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!(fieldKey in FIELD_LIMITS)) {
      return NextResponse.json(
        { error: "Invalid fieldKey" },
        { status: 400 }
      );
    }

    const typedFieldKey = fieldKey as FieldKey;
    const limit = FIELD_LIMITS[typedFieldKey];

    const translated = await translateWithinLimit({
      sourceLocale,
      targetLocale,
      fieldKey: typedFieldKey,
      text,
      limit,
    });

    return NextResponse.json({
      translatedText: translated.text,
      warning: translated.warning,
      error: translated.error,
      charCount: countChars(translated.text),
      charLimit: limit,
      withinLimit: countChars(translated.text) <= limit,
    });
  } catch (error) {
    console.error("translate route error:", error);

    const message =
      error instanceof Error ? error.message : "Translation failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}