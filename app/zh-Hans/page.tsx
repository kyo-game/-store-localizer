"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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

type LocaleOption = {
  code: string;
  label: string;
};

type PlanMode = "single" | "all";
type ModalStep = "plan" | "language";
type PlanId =
  | "single_3"
  | "single_10"
  | "single_all"
  | "all_3"
  | "all_10"
  | "all_all";

type PlanOption = {
  id: PlanId;
  name: string;
  count: 3 | 10 | "all";
  countLabel: string;
  priceJpy: string;
  priceUsd: string;
};

type PurchasedPlan = {
  mode: PlanMode;
  fieldKey: FieldKey | null;
  planId: string;
  planName: string;
  count: 3 | 10 | "all";
  countLabel: string;
  price: string;
  selectedLocales: string[];
};

type TranslatedField = {
  text: string;
  warning: boolean;
  error: boolean;
};

type SourceLocaleFields = Record<FieldKey, string>;
type LocaleFields = Record<FieldKey, TranslatedField>;
type LocalizedMap = Record<string, LocaleFields>;

type PendingCheckout = {
  planId: PlanId;
  planMode: PlanMode;
  selectedField: FieldKey | null;
  locales: string[];
  sourceLocale: string;
  sourceFields: SourceLocaleFields;
  sessionId?: string;
};

type PersistedState = {
  sourceLocale: string;
  localizedData: LocalizedMap;
  sourceInputs: Record<string, SourceLocaleFields>;
  purchasedPlan: PurchasedPlan | null;
  targetLocale: string;
};

type CheckoutResponse = {
  url?: string;
  sessionId?: string;
  error?: string;
};

type TranslationJobResponse = {
  jobId: string;
  error?: string;
};

type TranslationJobStatusResponse = {
  jobId: string;
  status: "processing" | "completed" | "failed";
  done: number;
  total: number;
  progressLabel: string;
  error: string | null;
  errorCode?:
    | "CREDIT_INSUFFICIENT"
    | "TRANSLATION_FAILED"
    | "TRANSLATION_ERROR_FALLBACK"
    | null;
  result: {
    sourceLocale: string;
    sourceFields: SourceLocaleFields;
    purchasedPlan: PurchasedPlan;
    results: Record<string, LocaleFields>;
  } | null;
};

type ServiceStatusResponse = {
  enabled: boolean;
  unavailableReason?: string | null;
};

const STORAGE_KEY = "storelocalizer_state_v1";

const ACTIVE_JOB_KEY = "storelocalizer_active_job_v1";

type ActiveTranslationJob = {
  jobId: string;
  startedAt: number;
};

const LOCALES: LocaleOption[] = [
  { code: "ar-SA", label: "阿拉伯语（沙特阿拉伯）" },
  { code: "ca", label: "加泰罗尼亚语" },
  { code: "zh-Hans", label: "中文（简体）" },
  { code: "zh-Hant", label: "中文（繁体）" },
  { code: "hr", label: "克罗地亚语" },
  { code: "cs", label: "捷克语" },
  { code: "da", label: "丹麦语" },
  { code: "nl-NL", label: "荷兰语" },
  { code: "en-AU", label: "英语（澳大利亚）" },
  { code: "en-CA", label: "英语（加拿大）" },
  { code: "en-GB", label: "英语（英国）" },
  { code: "en-US", label: "英语（美国）" },
  { code: "fi", label: "芬兰语" },
  { code: "fr-CA", label: "法语（加拿大）" },
  { code: "fr-FR", label: "法语（法国）" },
  { code: "de-DE", label: "德语" },
  { code: "el", label: "希腊语" },
  { code: "he", label: "希伯来语" },
  { code: "hi", label: "印地语" },
  { code: "hu", label: "匈牙利语" },
  { code: "id", label: "印尼语" },
  { code: "it", label: "意大利语" },
  { code: "ja", label: "日语" },
  { code: "ko", label: "韩语" },
  { code: "ms", label: "马来语" },
  { code: "no", label: "挪威语" },
  { code: "pl", label: "波兰语" },
  { code: "pt-BR", label: "葡萄牙语（巴西）" },
  { code: "pt-PT", label: "葡萄牙语（葡萄牙）" },
  { code: "ro", label: "罗马尼亚语" },
  { code: "ru", label: "俄语" },
  { code: "sk", label: "斯洛伐克语" },
  { code: "es-MX", label: "西班牙语（墨西哥）" },
  { code: "es-ES", label: "西班牙语（西班牙）" },
  { code: "sv", label: "瑞典语" },
  { code: "th", label: "泰语" },
  { code: "tr", label: "土耳其语" },
  { code: "uk", label: "乌克兰语" },
  { code: "vi", label: "越南语" },
];

const FIELD_LABELS: { key: FieldKey; label: string; multiline?: boolean }[] = [
  { key: "title", label: "标题" },
  { key: "subtitle", label: "副标题" },
  { key: "promotionalText", label: "推广文本", multiline: true },
  { key: "description", label: "应用描述", multiline: true },
  { key: "keywords", label: "关键词" },
  { key: "whatsNew", label: "本版本更新内容", multiline: true },
  { key: "iapDisplayName", label: "IAP 显示名称" },
  { key: "iapDescription", label: "IAP 描述" },
  { key: "subscriptionGroupDisplayName", label: "订阅组显示名称" },
  { key: "subscriptionCustomName", label: "订阅自定义名称" },
];

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

const SINGLE_FIELD_PLANS: PlanOption[] = [
  { id: "single_3", name: "轻量版", count: 3, countLabel: "3 种语言", priceJpy: "¥150", priceUsd: "$0.99" },
  { id: "single_10", name: "标准版", count: 10, countLabel: "10 种语言", priceJpy: "¥390", priceUsd: "$2.99" },
  { id: "single_all", name: "专业版", count: "all", countLabel: "全部 38 种语言", priceJpy: "¥860", priceUsd: "$6.99" },
];

const ALL_FIELD_PLANS: PlanOption[] = [
  { id: "all_3", name: "轻量版", count: 3, countLabel: "3 种语言", priceJpy: "¥590", priceUsd: "$4.00" },
  { id: "all_10", name: "标准版", count: 10, countLabel: "10 种语言", priceJpy: "¥1480", priceUsd: "$9.99" },
  { id: "all_all", name: "专业版", count: "all", countLabel: "全部 38 种语言", priceJpy: "¥2980", priceUsd: "$19.99" },
];

const KANA_RE = /[\u3040-\u30ff]/g;
const HAN_RE = /[\u3400-\u4dbf\u4e00-\u9fff]/g;
const HANGUL_RE = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/g;
const ARABIC_RE = /[\u0600-\u06ff]/g;
const HEBREW_RE = /[\u0590-\u05ff]/g;
const CYRILLIC_RE = /[\u0400-\u04ff]/g;
const DEVANAGARI_RE = /[\u0900-\u097f]/g;
const THAI_RE = /[\u0e00-\u0e7f]/g;
const LATIN_RE = /[A-Za-z]/g;

const emptySourceFields = (): SourceLocaleFields => ({
  title: "",
  subtitle: "",
  promotionalText: "",
  description: "",
  keywords: "",
  whatsNew: "",
  iapDisplayName: "",
  iapDescription: "",
  subscriptionGroupDisplayName: "",
  subscriptionCustomName: "",
});

const emptyTranslatedField = (): TranslatedField => ({
  text: "",
  warning: false,
  error: false,
});

const emptyFields = (): LocaleFields => ({
  title: emptyTranslatedField(),
  subtitle: emptyTranslatedField(),
  promotionalText: emptyTranslatedField(),
  description: emptyTranslatedField(),
  keywords: emptyTranslatedField(),
  whatsNew: emptyTranslatedField(),
  iapDisplayName: emptyTranslatedField(),
  iapDescription: emptyTranslatedField(),
  subscriptionGroupDisplayName: emptyTranslatedField(),
  subscriptionCustomName: emptyTranslatedField(),
});

function getOrderedLocales(codes: string[]) {
  const selected = new Set(codes);
  return LOCALES.map((x) => x.code).filter((code) => selected.has(code));
}

function normalizeDetectedLocale(code: string) {
  const lower = code.toLowerCase();

  const exact = LOCALES.find((x) => x.code.toLowerCase() === lower);
  if (exact) return exact.code;

  if (lower.startsWith("ja")) return "ja";
  if (lower.startsWith("en-gb")) return "en-GB";
  if (lower.startsWith("en-au")) return "en-AU";
  if (lower.startsWith("en-ca")) return "en-CA";
  if (lower.startsWith("en")) return "en-US";
  if (lower.startsWith("es-mx")) return "es-MX";
  if (lower.startsWith("es")) return "es-ES";
  if (lower.startsWith("pt-pt")) return "pt-PT";
  if (lower.startsWith("pt")) return "pt-BR";
  if (lower.startsWith("fr-ca")) return "fr-CA";
  if (lower.startsWith("fr")) return "fr-FR";
  if (lower.startsWith("de")) return "de-DE";
  if (lower.startsWith("zh-hant")) return "zh-Hant";
  if (lower.startsWith("zh-hans")) return "zh-Hans";
  if (lower.startsWith("zh")) return "zh-Hans";
  if (lower.startsWith("ko")) return "ko";
  if (lower.startsWith("ru")) return "ru";
  if (lower.startsWith("vi")) return "vi";
  if (lower.startsWith("th")) return "th";
  if (lower.startsWith("ar")) return "ar-SA";
  if (lower.startsWith("he")) return "he";
  if (lower.startsWith("it")) return "it";
  if (lower.startsWith("id")) return "id";
  if (lower.startsWith("tr")) return "tr";
  if (lower.startsWith("pl")) return "pl";
  if (lower.startsWith("uk")) return "uk";
  if (lower.startsWith("nl")) return "nl-NL";
  if (lower.startsWith("sv")) return "sv";
  if (lower.startsWith("no")) return "no";
  if (lower.startsWith("da")) return "da";
  if (lower.startsWith("fi")) return "fi";
  if (lower.startsWith("cs")) return "cs";
  if (lower.startsWith("sk")) return "sk";
  if (lower.startsWith("ro")) return "ro";
  if (lower.startsWith("hu")) return "hu";
  if (lower.startsWith("hr")) return "hr";
  if (lower.startsWith("ca")) return "ca";
  if (lower.startsWith("el")) return "el";
  if (lower.startsWith("hi")) return "hi";
  if (lower.startsWith("ms")) return "ms";

  return "";
}

function getInitialSourceLocale() {
  if (typeof navigator === "undefined") return "zh-Hans";
  return normalizeDetectedLocale(navigator.language || "") || "zh-Hans";
}

function isCreditInsufficientMessage(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("credit_insufficient") ||
    lower.includes("[credit_insufficient]") ||
    lower.includes("insufficient_quota") ||
    lower.includes("account balance") ||
    lower.includes("credit") ||
    lower.includes("quota")
  );
}

function countMatches(text: string, re: RegExp) {
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

function getAllSourceText(fields: SourceLocaleFields) {
  return FIELD_LABELS.map(({ key }) => fields[key]?.trim() ?? "")
    .filter(Boolean)
    .join("\n");
}

function getLikelyLocaleFromText(fields: SourceLocaleFields): string | null {
  const text = getAllSourceText(fields);
  if (!text.trim()) return null;

  const kana = countMatches(text, KANA_RE);
  const han = countMatches(text, HAN_RE);
  const hangul = countMatches(text, HANGUL_RE);
  const arabic = countMatches(text, ARABIC_RE);
  const hebrew = countMatches(text, HEBREW_RE);
  const cyrillic = countMatches(text, CYRILLIC_RE);
  const devanagari = countMatches(text, DEVANAGARI_RE);
  const thai = countMatches(text, THAI_RE);
  const latin = countMatches(text, LATIN_RE);

  if (kana >= 3) return "ja";
  if (hangul >= 3) return "ko";
  if (arabic >= 3) return "ar-SA";
  if (hebrew >= 3) return "he";
  if (devanagari >= 3) return "hi";
  if (thai >= 3) return "th";
  if (cyrillic >= 3) return "ru";
  if (han >= 3 && kana === 0) return "zh-Hans";
  if (latin >= 8 && kana + han + hangul + arabic + hebrew + cyrillic + devanagari + thai === 0) {
    return "en-US";
  }

  return null;
}

function getLocaleScriptFamily(locale: string) {
  if (locale === "ja") return "ja";
  if (locale === "ko") return "ko";
  if (locale === "zh-Hans" || locale === "zh-Hant") return "zh";
  if (locale === "ar-SA") return "ar";
  if (locale === "he") return "he";
  if (locale === "hi") return "hi";
  if (locale === "th") return "th";
  if (locale === "ru" || locale === "uk") return "cy";
  return "latin";
}

function shouldShowSourceLocaleMismatchConfirm(
  selectedSourceLocale: string,
  fields: SourceLocaleFields
) {
  const likelyLocale = getLikelyLocaleFromText(fields);
  if (!likelyLocale) {
    return { shouldConfirm: false, message: "" };
  }

  const selectedFamily = getLocaleScriptFamily(selectedSourceLocale);
  const likelyFamily = getLocaleScriptFamily(likelyLocale);

  if (selectedFamily === likelyFamily) {
    return { shouldConfirm: false, message: "" };
  }

  const selectedLabel =
    LOCALES.find((x) => x.code === selectedSourceLocale)?.label ?? selectedSourceLocale;
  const likelyLabel =
    LOCALES.find((x) => x.code === likelyLocale)?.label ?? likelyLocale;

  return {
    shouldConfirm: true,
    message:
      `当前源语言设置为“${selectedLabel}”，但输入内容看起来像“${likelyLabel}”。\n\n` +
      `要继续吗？`,
  };
}

export default function Home() {
  const initialLocale = getInitialSourceLocale();

  const [sourceLocale, setSourceLocale] = useState(initialLocale);
  const [sourceInputs, setSourceInputs] = useState<Record<string, SourceLocaleFields>>({
    [initialLocale]: emptySourceFields(),
  });
  const [targetLocale, setTargetLocale] = useState("");
  const [localizedData, setLocalizedData] = useState<LocalizedMap>({});

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("plan");
  const [planMode, setPlanMode] = useState<PlanMode>("single");
  const [selectedField, setSelectedField] = useState<FieldKey | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [pendingLocales, setPendingLocales] = useState<string[]>([]);
  const [purchaseStatus, setPurchaseStatus] = useState("未购买");
  const [lastActionText, setLastActionText] = useState("尚未执行翻译");
  const [purchasedPlan, setPurchasedPlan] = useState<PurchasedPlan | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);

  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handledCheckoutRef = useRef(false);
  const hasLoadedLocalRef = useRef(false);

  const isJapaneseUser = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return navigator.language.toLowerCase().startsWith("ja");
  }, []);

  const hasResult = !!purchasedPlan;
  const sourceFields = sourceInputs[sourceLocale] ?? emptySourceFields();

  function displayPrice(plan: PlanOption) {
    return isJapaneseUser ? plan.priceJpy : plan.priceUsd;
  }

  function findPlanById(planId: PlanId) {
    return [...SINGLE_FIELD_PLANS, ...ALL_FIELD_PLANS].find((plan) => plan.id === planId) ?? null;
  }

  function switchSourceLocalePreserveInput(nextLocale: string) {
    if (!nextLocale || nextLocale === sourceLocale) return;
    setSourceInputs((prev) => ({
      ...prev,
      [nextLocale]: prev[nextLocale] ?? { ...sourceFields },
    }));
    setSourceLocale(nextLocale);
  }

  async function fetchServiceStatus() {
    try {
      const res = await fetch("/api/service-status", {
        cache: "no-store",
      });

      const data = (await res.json()) as ServiceStatusResponse & { error?: string };

      if (!res.ok) {
        setIsServiceUnavailable(false);
        return;
      }

      if (!data.enabled) {
        setIsServiceUnavailable(true);
        setPurchaseStatus("暂停中");
        setLastActionText("当前不可用");
        return;
      }

      setIsServiceUnavailable(false);
    } catch {
      setIsServiceUnavailable(false);
    }
  }

  function markServiceUnavailable(cancelSucceeded: boolean) {
    setIsServiceUnavailable(true);
    setIsPlanModalOpen(false);
    setModalStep("plan");
    setSelectedPlan(null);
    setPendingLocales([]);
    setIsCheckoutLoading(false);
    setIsTranslating(false);
    setProgressCurrent(0);
    setProgressTotal(0);
    setProgressLabel("");
    setPurchasedPlan(null);
    setTargetLocale("");
    setPurchaseStatus("暂停中");
    setLastActionText(
      cancelSucceeded
        ? "由于翻译失败，付款已取消"
        : "当前不可用"
    );
  }

  const sourceLabel = useMemo(
    () => LOCALES.find((x) => x.code === sourceLocale)?.label ?? sourceLocale,
    [sourceLocale]
  );

  const selectedFieldLabel = useMemo(
    () => FIELD_LABELS.find((x) => x.key === selectedField)?.label ?? "",
    [selectedField]
  );

  const currentPlans = planMode === "single" ? SINGLE_FIELD_PLANS : ALL_FIELD_PLANS;

  const availableTargetLocales = useMemo(() => {
    return getOrderedLocales(purchasedPlan?.selectedLocales ?? []);
  }, [purchasedPlan]);

  const targetFields = useMemo(() => {
    if (!targetLocale) return emptyFields();
    return localizedData[targetLocale] ?? emptyFields();
  }, [localizedData, targetLocale]);

  const targetLabel = useMemo(() => {
    if (!targetLocale) return "";
    return LOCALES.find((x) => x.code === targetLocale)?.label ?? targetLocale;
  }, [targetLocale]);

  const resultFieldLabels = useMemo(() => {
    if (!purchasedPlan) return [] as typeof FIELD_LABELS;

    if (purchasedPlan.mode === "single" && purchasedPlan.fieldKey) {
      return FIELD_LABELS.filter((field) => field.key === purchasedPlan.fieldKey);
    }

    return FIELD_LABELS;
  }, [purchasedPlan]);

  const hasAnySourceText = useMemo(() => {
    return FIELD_LABELS.some((field) => sourceFields[field.key].trim() !== "");
  }, [sourceFields]);

  const progressPercent = useMemo(() => {
    if (!isTranslating || progressTotal <= 0) return 0;
    return Math.min(100, Math.round((progressCurrent / progressTotal) * 100));
  }, [isTranslating, progressCurrent, progressTotal]);

  const progressCircleStyle = useMemo(() => {
    const deg = progressPercent * 3.6;
    return {
      background: `conic-gradient(white 0deg ${deg}deg, rgba(255,255,255,0.12) ${deg}deg 360deg)`,
    };
  }, [progressPercent]);

  function showCopyToast(message: string) {
    setCopyMessage(message);
    window.setTimeout(() => setCopyMessage(""), 1500);
  }

  function showImportToast(message: string) {
    setImportMessage(message);
    window.setTimeout(() => setImportMessage(""), 1500);
  }

  function getCount(text: unknown) {
    return typeof text === "string" ? text.length : 0;
  }

  function updateField(locale: string, key: FieldKey, value: string) {
    setSourceInputs((prev) => ({
      ...prev,
      [locale]: {
        ...(prev[locale] ?? emptySourceFields()),
        [key]: value,
      },
    }));
  }

  function handleSourceLocaleChange(nextLocale: string) {
    switchSourceLocalePreserveInput(nextLocale);
  }

  function openSingleFieldPlanModal(fieldKey: FieldKey) {
    if (hasResult || isServiceUnavailable) return;
    if (!sourceFields[fieldKey].trim()) return;

    const mismatch = shouldShowSourceLocaleMismatchConfirm(sourceLocale, sourceFields);
    if (mismatch.shouldConfirm) {
      const ok = window.confirm(mismatch.message);
      if (!ok) {
        setLastActionText("已取消翻译");
        return;
      }
    }

    setPlanMode("single");
    setSelectedField(fieldKey);
    setSelectedPlan(null);
    setPendingLocales([]);
    setModalStep("plan");
    setIsPlanModalOpen(true);
  }

  function openAllFieldsPlanModal() {
    if (hasResult || isServiceUnavailable) return;
    if (!hasAnySourceText) return;

    const mismatch = shouldShowSourceLocaleMismatchConfirm(sourceLocale, sourceFields);
    if (mismatch.shouldConfirm) {
      const ok = window.confirm(mismatch.message);
      if (!ok) {
        setLastActionText("已取消翻译");
        return;
      }
    }

    setPlanMode("all");
    setSelectedField(null);
    setSelectedPlan(null);
    setPendingLocales([]);
    setModalStep("plan");
    setIsPlanModalOpen(true);
  }

  function closePlanModal() {
    setIsPlanModalOpen(false);
    setModalStep("plan");
    setSelectedPlan(null);
    setPendingLocales([]);
  }

  function handleOpenResetConfirm() {
    setIsResetConfirmOpen(true);
  }

  function closeResetConfirm() {
    setIsResetConfirmOpen(false);
  }

  function handleResetAll() {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("pendingCheckout");
    localStorage.removeItem(ACTIVE_JOB_KEY);

    const resetLocale = getInitialSourceLocale();

    setSourceLocale(resetLocale);
    setTargetLocale("");
    setSourceInputs({ [resetLocale]: emptySourceFields() });
    setLocalizedData({});
    setIsPlanModalOpen(false);
    setModalStep("plan");
    setPlanMode("single");
    setSelectedField(null);
    setSelectedPlan(null);
    setPendingLocales([]);
    setPurchaseStatus("未购买");
    setLastActionText("已初始化");
    setPurchasedPlan(null);
    setCopyMessage("");
    setImportMessage("");
    setIsDragging(false);
    setIsTranslating(false);
    setIsCheckoutLoading(false);
    setProgressCurrent(0);
    setProgressTotal(0);
    setProgressLabel("");
    setIsResetConfirmOpen(false);
  }

  async function beginCheckout(plan: PlanOption, locales: string[]) {
    try {
      if (isServiceUnavailable) {
        setLastActionText("当前不可用");
        return;
      }

      setIsCheckoutLoading(true);
      setLastActionText("正在跳转到付款页面...");

      const orderedLocales = getOrderedLocales(locales);

      const pendingCheckout: PendingCheckout = {
        planId: plan.id,
        planMode,
        selectedField,
        locales: orderedLocales,
        sourceLocale,
        sourceFields: { ...sourceFields },
      };

      sessionStorage.setItem("pendingCheckout", JSON.stringify(pendingCheckout));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
          planMode,
          selectedField: selectedField ?? "",
          localeCount: String(orderedLocales.length),
          selectedLocales: orderedLocales.join(","),
          returnPath: "/zh-Hans",
        }),
      });

      const data = (await res.json()) as CheckoutResponse;

      if (!res.ok || !data?.url || !data?.sessionId) {
        throw new Error(data?.error || "Checkout failed");
      }

      sessionStorage.setItem(
        "pendingCheckout",
        JSON.stringify({
          ...pendingCheckout,
          sessionId: data.sessionId,
        })
      );

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setLastActionText("无法打开付款页面");
      setIsCheckoutLoading(false);
    }
  }

  function handlePlanSelect(plan: PlanOption) {
    if (isServiceUnavailable) {
      setLastActionText("当前不可用");
      return;
    }

    setSelectedPlan(plan);

    if (plan.count === "all") {
      const locales = LOCALES.map((x) => x.code).filter((code) => code !== sourceLocale);
      void beginCheckout(plan, locales);
      return;
    }

    setPendingLocales([]);
    setModalStep("language");
  }

  function togglePendingLocale(code: string) {
    if (!selectedPlan || selectedPlan.count === "all") return;

    setPendingLocales((prev) => {
      if (prev.includes(code)) {
        return prev.filter((x) => x !== code);
      }

      const maxCount = selectedPlan.count;
      if (maxCount === "all") return prev;
      if (prev.length >= maxCount) {
        return prev;
      }

      return getOrderedLocales([...prev, code]);
    });
  }

  async function startTranslationJob(
    sourceLocaleCode: string,
    sourceData: SourceLocaleFields,
    plan: PurchasedPlan,
    sessionId: string
  ) {
    const res = await fetch("/api/translate-job/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceLocale: sourceLocaleCode,
        sourceFields: sourceData,
        purchasedPlan: {
          ...plan,
          selectedLocales: getOrderedLocales(plan.selectedLocales),
        },
        sessionId,
      }),
    });

    const data = (await res.json()) as TranslationJobResponse;

    if (res.status === 503) {
      throw new Error("SERVICE_UNAVAILABLE");
    }

    if (!res.ok || !data.jobId) {
      throw new Error(data.error || "Failed to start translation job");
    }

    return data.jobId;
  }

  async function pollTranslationJob(jobId: string) {
    while (true) {
      const res = await fetch(`/api/translate-job/status?jobId=${encodeURIComponent(jobId)}`, {
        cache: "no-store",
      });
  
      const data = (await res.json()) as TranslationJobStatusResponse & { error?: string };
  
      if (!res.ok) {
        throw new Error(data.error || "Failed to get translation job status");
      }
  
      setProgressCurrent(data.done);
      setProgressTotal(data.total);
      setProgressLabel(data.progressLabel);
  
      if (data.status === "completed") {
        if (!data.result) {
          throw new Error("Translation result is missing");
        }
  
        const result = data.result;
        const orderedLocales = getOrderedLocales(result.purchasedPlan.selectedLocales);
  
        setSourceLocale(result.sourceLocale);
        setSourceInputs((prev) => ({
          ...prev,
          [result.sourceLocale]: result.sourceFields,
        }));
        setLocalizedData(result.results);
        setPurchasedPlan({
          ...result.purchasedPlan,
          selectedLocales: orderedLocales,
        });
        setTargetLocale(orderedLocales[0] ?? "");
        setPurchaseStatus("购买完成");
        setLastActionText("翻译已完成");
  
        localStorage.removeItem(ACTIVE_JOB_KEY);
        return;
      }
  
      if (data.status === "failed") {
        localStorage.removeItem(ACTIVE_JOB_KEY);
        throw new Error(data.error || "Translation failed");
      }
  
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  async function finalizePurchase(
    plan: PlanOption,
    locales: string[],
    mode: PlanMode,
    fieldKey: FieldKey | null,
    sourceLocaleCode: string,
    sourceData: SourceLocaleFields,
    sessionId: string
  ) {
    const orderedLocales = getOrderedLocales(locales);

    const actionText =
      mode === "single"
        ? `购买完成：${plan.name} / ${plan.countLabel} / 仅${FIELD_LABELS.find((x) => x.key === fieldKey)?.label ?? ""}`
        : `购买完成：${plan.name} / ${plan.countLabel} / 全部字段`;

    const nextPlan: PurchasedPlan = {
      mode,
      fieldKey,
      planId: plan.id,
      planName: plan.name,
      count: plan.count,
      countLabel: plan.countLabel,
      price: displayPrice(plan),
      selectedLocales: orderedLocales,
    };

    setSourceLocale(sourceLocaleCode);
    setSourceInputs((prev) => ({
      ...prev,
      [sourceLocaleCode]: { ...sourceData },
    }));

    setLocalizedData((prev) => {
      const next = { ...prev };
      orderedLocales.forEach((locale) => {
        next[locale] = next[locale] ?? emptyFields();
      });
      return next;
    });

    setPurchaseStatus("购买完成");
    setLastActionText(actionText);
    setPurchasedPlan(nextPlan);
    setTargetLocale(orderedLocales[0] ?? "");
    closePlanModal();

    setIsTranslating(true);
    setProgressCurrent(0);
    setProgressTotal(0);
    setProgressLabel("starting");

    try {
      const jobId = await startTranslationJob(sourceLocaleCode, sourceData, nextPlan, sessionId);

      localStorage.setItem(
        ACTIVE_JOB_KEY,
        JSON.stringify({
          jobId,
          startedAt: Date.now(),
        } satisfies ActiveTranslationJob)
      );

      await pollTranslationJob(jobId);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Translation failed";

      if (message === "SERVICE_UNAVAILABLE") {
        await fetchServiceStatus();
        setPurchasedPlan(null);
        setTargetLocale("");
      } else if (isCreditInsufficientMessage(message)) {
        markServiceUnavailable(true);
      } else {
        setLastActionText("翻译失败");
        setPurchasedPlan(null);
        setTargetLocale("");
      }
    } finally {
      setIsTranslating(false);
      setProgressCurrent(0);
      setProgressTotal(0);
      setProgressLabel("");
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        hasLoadedLocalRef.current = true;
      } else {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;

        if (parsed.sourceLocale && typeof parsed.sourceLocale === "string") {
          setSourceLocale(parsed.sourceLocale);
        }

        if (parsed.sourceInputs && typeof parsed.sourceInputs === "object") {
          setSourceInputs(parsed.sourceInputs as Record<string, SourceLocaleFields>);
        } else if (parsed.sourceLocale && parsed.localizedData) {
          const maybeSource = (parsed.localizedData as Record<string, unknown>)[parsed.sourceLocale];
          const nextInputs =
            maybeSource && typeof maybeSource === "object"
              ? ({
                  [parsed.sourceLocale]: Object.fromEntries(
                    FIELD_LABELS.map(({ key }) => {
                      const v = (maybeSource as Record<string, unknown>)[key];
                      if (typeof v === "string") return [key, v];
                      if (v && typeof v === "object") {
                        const obj = v as Record<string, unknown>;
                        return [key, typeof obj.text === "string" ? obj.text : ""];
                      }
                      return [key, ""];
                    })
                  ),
                } as Record<string, SourceLocaleFields>)
              : { [parsed.sourceLocale]: emptySourceFields() };
          setSourceInputs(nextInputs);
        }

        if (parsed.localizedData && typeof parsed.localizedData === "object") {
          const normalized: LocalizedMap = {};
          Object.entries(parsed.localizedData as Record<string, unknown>).forEach(([locale, fields]) => {
            if (!fields || typeof fields !== "object") return;
            const next = emptyFields();
            FIELD_LABELS.forEach(({ key }) => {
              const rawField = (fields as Record<string, unknown>)[key];
              if (typeof rawField === "string") {
                next[key] = { text: rawField, warning: false, error: false };
              } else if (rawField && typeof rawField === "object") {
                const obj = rawField as Record<string, unknown>;
                next[key] = {
                  text: typeof obj.text === "string" ? obj.text : "",
                  warning: obj.warning === true,
                  error: obj.error === true,
                };
              }
            });
            normalized[locale] = next;
          });
          setLocalizedData(normalized);
        }

        if (parsed.purchasedPlan && typeof parsed.purchasedPlan === "object") {
          const restoredPlan = parsed.purchasedPlan as PurchasedPlan;
          const orderedLocales = getOrderedLocales(restoredPlan.selectedLocales ?? []);

          setPurchasedPlan({
            ...restoredPlan,
            selectedLocales: orderedLocales,
          });
          setPurchaseStatus("已从本地存储恢复");

          if (parsed.targetLocale && orderedLocales.includes(parsed.targetLocale)) {
            setTargetLocale(parsed.targetLocale);
          } else {
            setTargetLocale(orderedLocales[0] ?? "");
          }
        } else if (parsed.targetLocale && typeof parsed.targetLocale === "string") {
          setTargetLocale(parsed.targetLocale);
        }

        if (parsed.sourceLocale || parsed.localizedData || parsed.purchasedPlan) {
          setLastActionText("已从本地存储恢复");
        }

        hasLoadedLocalRef.current = true;
      }
    } catch (error) {
      console.error(error);
      hasLoadedLocalRef.current = true;
    }
  }, []);

  useEffect(() => {
    void fetchServiceStatus();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (handledCheckoutRef.current) return;
  
    const raw = localStorage.getItem(ACTIVE_JOB_KEY);
    if (!raw) return;
  
    try {
      const active = JSON.parse(raw) as Partial<ActiveTranslationJob>;
      const jobId = typeof active.jobId === "string" ? active.jobId.trim() : "";
  
      if (!jobId) {
        localStorage.removeItem(ACTIVE_JOB_KEY);
        return;
      }
  
      setIsTranslating(true);
      setPurchaseStatus("正在翻译");
      setLastActionText("正在恢复上次翻译任务");
      setProgressCurrent(0);
      setProgressTotal(0);
      setProgressLabel("resuming");
  
      void pollTranslationJob(jobId).finally(() => {
        setIsTranslating(false);
        setProgressCurrent(0);
        setProgressTotal(0);
        setProgressLabel("");
      });
    } catch {
      localStorage.removeItem(ACTIVE_JOB_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasLoadedLocalRef.current) return;

    const payload: PersistedState = {
      sourceLocale,
      localizedData,
      sourceInputs,
      purchasedPlan,
      targetLocale,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [sourceLocale, sourceInputs, localizedData, purchasedPlan, targetLocale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (handledCheckoutRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");

    if (!checkout) return;

    handledCheckoutRef.current = true;
    setIsCheckoutLoading(false);

    if (checkout === "cancel") {
      setPurchaseStatus("未购买");
      setLastActionText("付款已取消");
      window.history.replaceState({}, "", "/zh-Hans");
      sessionStorage.removeItem("pendingCheckout");
      return;
    }

    if (checkout === "success") {
      const raw = sessionStorage.getItem("pendingCheckout");
      sessionStorage.removeItem("pendingCheckout");
      window.history.replaceState({}, "", "/zh-Hans");

      if (!raw) {
        setLastActionText("无法恢复付款后的数据");
        return;
      }

      try {
        const pending = JSON.parse(raw) as PendingCheckout;
        const plan = findPlanById(pending.planId);

        if (!plan) {
          setLastActionText("无法恢复套餐信息");
          return;
        }

        if (!pending.sessionId) {
          setLastActionText("无法恢复付款信息");
          return;
        }

        void finalizePurchase(
          plan,
          pending.locales,
          pending.planMode,
          pending.selectedField,
          pending.sourceLocale,
          pending.sourceFields,
          pending.sessionId
        );
      } catch (error) {
        console.error(error);
        setLastActionText("无法恢复付款后的数据");
      }
    }
  }, []);

  function handleCheckoutForSelectedPlan() {
    if (!selectedPlan || isServiceUnavailable) return;

    const selectedCount = selectedPlan.count;
    const isExactCount =
      selectedCount !== "all" && pendingLocales.length === selectedCount;

    if (!isExactCount) return;
    void beginCheckout(selectedPlan, pendingLocales);
  }

  async function copyText(text: string, label: string) {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      showCopyToast(`已复制${label}`);
    } catch {
      showCopyToast("复制失败");
    }
  }

  function sanitizeFileNamePart(value: string) {
    return value
      .normalize("NFKC")
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "-")
      .trim()
      .slice(0, 60);
  }

  function handleDownloadJson() {
    if (!purchasedPlan) return;

    const orderedLocales = getOrderedLocales(purchasedPlan.selectedLocales);

    const exportData = {
      sourceLocale,
      sourceFields: sourceInputs[sourceLocale] ?? emptySourceFields(),
      purchasedPlan: {
        ...purchasedPlan,
        selectedLocales: orderedLocales,
      },
      results: orderedLocales.reduce<Record<string, LocaleFields>>((acc, locale) => {
        acc[locale] = localizedData[locale] ?? emptyFields();
        return acc;
      }, {}),
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const sourceTitle = (sourceInputs[sourceLocale]?.title ?? "").trim() || "untitled";
    const safeTitle = sanitizeFileNamePart(sourceTitle);
    const fieldCount =
      purchasedPlan.mode === "single" && purchasedPlan.fieldKey ? 1 : FIELD_LABELS.length;
    const localeCount = orderedLocales.length;

    const fileName = `${safeTitle}-storelocalizer-${fieldCount}fields-${localeCount}locales.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);
  }

  function restoreFromJsonText(text: string) {
    try {
      const parsed = JSON.parse(text);

      const nextSourceLocale =
        typeof parsed.sourceLocale === "string" ? parsed.sourceLocale : getInitialSourceLocale();

      const nextSourceFields =
        parsed.sourceFields && typeof parsed.sourceFields === "object"
          ? { ...emptySourceFields(), ...parsed.sourceFields }
          : emptySourceFields();

      const nextPurchasedPlan =
        parsed.purchasedPlan && typeof parsed.purchasedPlan === "object"
          ? (parsed.purchasedPlan as PurchasedPlan)
          : null;

      const orderedLocales = getOrderedLocales(nextPurchasedPlan?.selectedLocales ?? []);

      const nextResults =
        parsed.results && typeof parsed.results === "object"
          ? (parsed.results as Record<string, unknown>)
          : {};

      const nextLocalizedData: LocalizedMap = {};

      Object.entries(nextResults).forEach(([locale, fields]) => {
        const next = emptyFields();
        if (fields && typeof fields === "object") {
          FIELD_LABELS.forEach(({ key }) => {
            const rawField = (fields as Record<string, unknown>)[key];
            if (typeof rawField === "string") {
              next[key] = { text: rawField, warning: false, error: false };
            } else if (rawField && typeof rawField === "object") {
              const obj = rawField as Record<string, unknown>;
              next[key] = {
                text: typeof obj.text === "string" ? obj.text : "",
                warning: obj.warning === true,
                error: obj.error === true,
              };
            }
          });
        }
        nextLocalizedData[locale] = next;
      });

      setSourceLocale(nextSourceLocale);
      setSourceInputs((prev) => ({
        ...prev,
        [nextSourceLocale]: nextSourceFields,
      }));
      setLocalizedData(nextLocalizedData);
      setPurchasedPlan(
        nextPurchasedPlan
          ? {
              ...nextPurchasedPlan,
              selectedLocales: orderedLocales,
            }
          : null
      );
      setTargetLocale(orderedLocales[0] ?? "");
      setPurchaseStatus(nextPurchasedPlan ? "已从 JSON 恢复" : "未购买");
      setLastActionText("已从 JSON 恢复");
      showImportToast("JSON 已加载");
    } catch {
      showImportToast("JSON 加载失败");
    }
  }

  function handleFile(file: File | null) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      restoreFromJsonText(text);
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Store Localizer</h1>
            <p className="mt-3 text-zinc-100">
              在字符数限制内翻译 App Store / Google Play 商店文案
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              可翻译、保存和复制标题、副标题、推广文本、应用描述、关键词、更新内容、IAP 显示名称、IAP 描述、订阅组显示名称和订阅自定义名称。
            </p>
            <div className="mt-2 flex items-center justify-between gap-4">
              <p className="text-sm text-zinc-400">
                在左侧输入源文本，翻译结果会显示在右侧
              </p>

              <Link
                href="/zh-Hans/how-to"
                className="shrink-0 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                使用方法
              </Link>
            </div>
          </div>
        </div>

        {isServiceUnavailable ? (
          <div className="mt-6 rounded-2xl border border-red-500 bg-red-500/10 px-5 py-4">
            <p className="text-base font-bold text-red-300">当前不可用</p>
            <p className="mt-1 text-sm text-red-200">
              翻译服务当前已暂停。
            </p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-lg font-semibold">输入</h2>

            <div className="mt-4">
              <label htmlFor="source-locale" className="mb-2 block text-sm text-zinc-300">
                源语言
              </label>
              <select
                id="source-locale"
                title="源语言"
                value={sourceLocale}
                onChange={(e) => handleSourceLocaleChange(e.target.value)}
                disabled={hasResult || isServiceUnavailable}
                className={`w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none ${
                  hasResult || isServiceUnavailable ? "cursor-not-allowed text-zinc-500 opacity-60" : ""
                }`}
              >
                {LOCALES.map((locale) => (
                  <option key={locale.code} value={locale.code}>
                    {locale.label}
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-3 text-xs text-zinc-500">{sourceLabel}</p>

            <div className="mt-5 space-y-4">
              {FIELD_LABELS.map((field) => {
                const sourceText = sourceFields[field.key];
                const sourceCount = getCount(sourceText);
                const sourceLimit = Number(FIELD_LIMITS[field.key]);
                const sourceOver = sourceCount > sourceLimit;
                const canTranslateThisField =
                  sourceText.trim() !== "" && !hasResult && !isServiceUnavailable;
                const sourceInputId = `source-${field.key}`;

                return (
                  <div
                    key={field.key}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4"
                  >
                    <label htmlFor={sourceInputId} className="mb-2 block text-sm text-zinc-300">
                      {field.label}
                    </label>

                    {field.multiline ? (
                      <textarea
                        id={sourceInputId}
                        title={field.label}
                        value={sourceText}
                        onChange={(e) =>
                          updateField(sourceLocale, field.key, e.target.value)
                        }
                        disabled={hasResult || isServiceUnavailable}
                        className={`min-h-[120px] w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none ${
                          hasResult || isServiceUnavailable ? "cursor-not-allowed text-zinc-500 opacity-60" : ""
                        }`}
                      />
                    ) : (
                      <input
                        id={sourceInputId}
                        title={field.label}
                        value={sourceText}
                        onChange={(e) =>
                          updateField(sourceLocale, field.key, e.target.value)
                        }
                        disabled={hasResult || isServiceUnavailable}
                        className={`w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none ${
                          hasResult || isServiceUnavailable ? "cursor-not-allowed text-zinc-500 opacity-60" : ""
                        }`}
                      />
                    )}

                    <div className="mt-2 text-right text-xs">
                      <span className={sourceOver ? "text-red-400" : "text-zinc-500"}>
                        {sourceCount} / {sourceLimit}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openSingleFieldPlanModal(field.key)}
                      disabled={!canTranslateThisField}
                      className={`mt-3 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                        canTranslateThisField
                          ? "bg-violet-600 hover:bg-violet-500"
                          : "cursor-not-allowed bg-zinc-700 text-zinc-400"
                      }`}
                    >
                      仅翻译此字段
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={openAllFieldsPlanModal}
                disabled={!hasAnySourceText || hasResult || isServiceUnavailable}
                className={`w-full rounded-xl px-4 py-4 font-semibold text-white transition ${
                  hasAnySourceText && !hasResult && !isServiceUnavailable
                    ? "bg-blue-500 hover:bg-blue-400"
                    : "cursor-not-allowed bg-zinc-700 text-zinc-400"
                }`}
              >
                翻译全部字段
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            {!purchasedPlan ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  title="加载 JSON 文件"
                  aria-label="加载 JSON 文件"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                  className={`flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center transition ${
                    isDragging
                      ? "border-white bg-zinc-800/60"
                      : "border-zinc-700 bg-zinc-950/40"
                  }`}
                >
                  {isServiceUnavailable ? (
                    <>
                      <p className="text-base font-semibold text-red-300">
                        当前不可用
                      </p>
                      <p className="mt-2 text-sm text-zinc-400">
                        请等待服务恢复
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-semibold">
                        已购买的翻译结果可通过上传 JSON 文件重新显示
                      </p>
                      <p className="mt-2 text-sm text-zinc-500">将 JSON 文件拖到这里</p>
                      <p className="mt-2 text-sm text-zinc-500">
                        或点击选择 JSON 文件
                      </p>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-5 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                      >
                        加载 JSON
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">结果</h2>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenResetConfirm}
                      className="rounded-xl border border-red-500 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                    >
                      初始化
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadJson}
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                    >
                      下载 JSON
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {availableTargetLocales.map((code) => {
                    const label =
                      LOCALES.find((x) => x.code === code)?.label ?? code;
                    const active = code === targetLocale;

                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setTargetLocale(code)}
                        className={`rounded-xl px-4 py-2 text-sm transition ${
                          active
                            ? "bg-blue-500 text-white"
                            : "border border-zinc-700 bg-zinc-950 text-white hover:bg-zinc-800"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <p className="mt-3 text-xs text-zinc-500">{targetLabel}</p>

                <div className="mt-5 space-y-4">
                  {resultFieldLabels.map((field) => {
                    const targetField = targetFields[field.key] ?? emptyTranslatedField();
                    const targetText = targetField.text ?? "";
                    const targetWarning = targetField.warning === true;
                    const targetError = targetField.error === true;
                    const targetCount = targetText.length;
                    const targetLimit = Number(FIELD_LIMITS[field.key]);
                    const targetOver = targetCount > targetLimit;
                    const targetInputId = `target-${targetLocale}-${field.key}`;

                    return (
                      <div key={field.key}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label htmlFor={targetInputId} className="block text-sm text-zinc-300">
                            {field.label}
                          </label>
                          <button
                            type="button"
                            onClick={() => copyText(targetText, field.label)}
                            className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800"
                          >
                            复制
                          </button>
                        </div>

                        {field.multiline ? (
                          <textarea
                            id={targetInputId}
                            title={field.label}
                            value={targetText}
                            readOnly
                            className={`min-h-[120px] w-full rounded-xl border bg-zinc-950 px-4 py-3 text-zinc-300 outline-none ${
                              targetError ? "border-red-500" : "border-zinc-800"
                            }`}
                          />
                        ) : (
                          <input
                            id={targetInputId}
                            title={field.label}
                            value={targetText}
                            readOnly
                            className={`w-full rounded-xl border bg-zinc-950 px-4 py-3 text-zinc-300 outline-none ${
                              targetError ? "border-red-500" : "border-zinc-800"
                            }`}
                          />
                        )}

                        {targetError ? (
                          <p className="mt-2 text-left text-xs text-red-400">
                            错误
                          </p>
                        ) : targetWarning ? (
                          <p className="mt-2 text-left text-xs text-amber-400">
                            注意
                          </p>
                        ) : null}

                        <div className="mt-2 text-right text-xs">
                          <span className={targetOver ? "text-red-400" : "text-zinc-500"}>
                            {targetCount} / {targetLimit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {copyMessage ? (
        <div className="fixed right-4 top-4 z-[70] rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black shadow-2xl">
          {copyMessage}
        </div>
      ) : null}

      {importMessage ? (
        <div className="fixed right-4 top-20 z-[70] rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-2xl">
          {importMessage}
        </div>
      ) : null}

      {isTranslating ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
            <div
              className="mx-auto flex h-28 w-28 items-center justify-center rounded-full p-[10px]"
              style={progressCircleStyle}
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-900 text-2xl font-bold">
                {progressPercent}%
              </div>
            </div>

            <p className="mt-6 text-xl font-bold">正在翻译...</p>
            <p className="mt-2 text-sm text-zinc-400">请稍候</p>

            <div className="mt-5 text-sm text-zinc-300">
              <p>{progressLabel}</p>
              <p className="mt-1 text-zinc-500">
                {progressCurrent} / {progressTotal}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {isPlanModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-4">
          <div className="flex h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 p-5">
              <div>
                <h3 className="text-xl font-bold">
                  {planMode === "single" ? "单字段翻译" : "全部字段翻译"}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {planMode === "single"
                    ? `目标：${selectedFieldLabel}`
                    : "目标：全部字段"}
                </p>
              </div>

              <button
                type="button"
                onClick={closePlanModal}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                ×
              </button>
            </div>

            {modalStep === "plan" ? (
              <div className="overflow-y-auto p-5">
                <div className="space-y-3">
                  {currentPlans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handlePlanSelect(plan)}
                      disabled={isCheckoutLoading || isServiceUnavailable}
                      className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-left transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold">
                            {plan.name} - {plan.countLabel}
                          </p>
                          <p className="mt-1 text-sm text-zinc-400">
                            {planMode === "single"
                              ? "仅翻译此项目"
                              : `${FIELD_LABELS.length} 个项目一起翻译`}
                          </p>
                        </div>
                        <p className="text-lg font-bold">{displayPrice(plan)}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                  当前启用 Stripe 测试付款。
                </p>
              </div>
            ) : null}

            {modalStep === "language" && selectedPlan && selectedPlan.count !== "all" ? (
              <>
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                  <p className="text-sm text-zinc-300">
                    请选择 {selectedPlan.count} 种语言
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalStep("plan")}
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    返回
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {LOCALES.filter((x) => x.code !== sourceLocale).map((locale) => {
                      const checked = pendingLocales.includes(locale.code);
                      const maxCount = selectedPlan.count;
                      const disabled =
                        !checked && maxCount !== "all" && pendingLocales.length >= maxCount;

                      return (
                        <button
                          key={locale.code}
                          type="button"
                          onClick={() => togglePendingLocale(locale.code)}
                          disabled={disabled || isCheckoutLoading || isServiceUnavailable}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                            checked
                              ? "border-blue-400 bg-blue-500 text-white"
                              : disabled
                              ? "border-zinc-800 bg-zinc-950 text-zinc-600"
                              : "border-zinc-700 bg-zinc-950 text-white hover:bg-zinc-800"
                          }`}
                        >
                          <span className="text-sm">{locale.label}</span>
                          <span className="text-xs">{checked ? "已选择" : ""}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-zinc-800 bg-zinc-900 p-5">
                  {(() => {
                    const selectedCount = selectedPlan.count;
                    const isExactCount = pendingLocales.length === selectedCount;

                    return (
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-zinc-400">
                          {pendingLocales.length} / {selectedPlan.count}
                        </p>
                        <button
                          type="button"
                          onClick={handleCheckoutForSelectedPlan}
                          disabled={
                            !isExactCount ||
                            isTranslating ||
                            isCheckoutLoading ||
                            isServiceUnavailable
                          }
                          className={`rounded-xl px-5 py-3 font-semibold ${
                            isExactCount &&
                            !isTranslating &&
                            !isCheckoutLoading &&
                            !isServiceUnavailable
                              ? "bg-blue-500 text-white"
                              : "bg-zinc-700 text-zinc-400"
                          }`}
                        >
                          {isCheckoutLoading ? "正在跳转..." : "前往付款"}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {isResetConfirmOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold">要初始化吗？</h3>
            <p className="mt-3 text-sm text-zinc-300">
              已经下载 JSON 文件了吗？
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              初始化后，当前结果会被删除。
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeResetConfirm}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
              >
                初始化
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="border-t border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-zinc-400 md:flex-row">
          <p>© 2026 StoreLocalizer</p>

          <div className="flex flex-wrap items-center gap-4">
            <a href="/zh-Hans/terms" className="transition hover:text-white">
              使用条款
            </a>
            <a href="/zh-Hans/privacy" className="transition hover:text-white">
              隐私政策
            </a>
            <a href="/zh-Hans/legal" className="transition hover:text-white">
              特定商业交易法声明
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}