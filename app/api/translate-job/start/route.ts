// app/api/translate-job/start/route.ts

import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import {
  cleanupOldJobs,
  createJob,
  failJob,
  type TranslationJobResult,
  updateJob,
} from "../_store";
import { translateWithinLimit } from "../../translate/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

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

type TranslatedField = {
  text: string;
  warning: boolean;
  error: boolean;
};

type LocaleFields = Record<FieldKey, TranslatedField>;
type SourceLocaleFields = Record<FieldKey, string>;

type StartBody = {
  sourceLocale: string;
  sourceFields: SourceLocaleFields;
  purchasedPlan: {
    mode: "single" | "all";
    fieldKey: FieldKey | null;
    planId: string;
    planName: string;
    count: 3 | 10 | "all";
    countLabel: string;
    price: string;
    selectedLocales: string[];
  };
  sessionId?: string;
};

const FIELD_LABELS: Record<FieldKey, string> = {
  title: "タイトル",
  subtitle: "サブタイトル",
  promotionalText: "プロモーション用テキスト",
  description: "概要",
  keywords: "キーワード",
  whatsNew: "このバージョンの最新情報",
  iapDisplayName: "IAP表示名",
  iapDescription: "IAP説明",
  subscriptionGroupDisplayName: "サブスクグループ表示名",
  subscriptionCustomName: "サブスクカスタム名",
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

function isFieldKey(value: unknown): value is FieldKey {
  return typeof value === "string" && value in FIELD_LIMITS;
}

function getEmptyTranslatedField(): TranslatedField {
  return {
    text: "",
    warning: false,
    error: false,
  };
}

function getErrorTranslatedField(): TranslatedField {
  return {
    text: "",
    warning: false,
    error: true,
  };
}

function getEmptyLocaleFields(): LocaleFields {
  return {
    title: getEmptyTranslatedField(),
    subtitle: getEmptyTranslatedField(),
    promotionalText: getEmptyTranslatedField(),
    description: getEmptyTranslatedField(),
    keywords: getEmptyTranslatedField(),
    whatsNew: getEmptyTranslatedField(),
    iapDisplayName: getEmptyTranslatedField(),
    iapDescription: getEmptyTranslatedField(),
    subscriptionGroupDisplayName: getEmptyTranslatedField(),
    subscriptionCustomName: getEmptyTranslatedField(),
  };
}

function getTargetFields(
  purchasedPlan: StartBody["purchasedPlan"],
  sourceFields: SourceLocaleFields
): FieldKey[] {
  if (purchasedPlan.mode === "single" && purchasedPlan.fieldKey) {
    return sourceFields[purchasedPlan.fieldKey].trim()
      ? [purchasedPlan.fieldKey]
      : [];
  }

  return (Object.keys(sourceFields) as FieldKey[]).filter((key) =>
    sourceFields[key].trim()
  );
}

function orderTargetFields(fields: FieldKey[]) {
  const ordered = [...fields];

  ordered.sort((a, b) => {
    if (a === "title") return -1;
    if (b === "title") return 1;
    return 0;
  });

  return ordered;
}

function shouldUseTitleContext(fieldKey: FieldKey) {
  return fieldKey !== "title" && fieldKey !== "keywords";
}

function isCreditInsufficientError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();

  return (
    lower.includes("insufficient_quota") ||
    lower.includes("quota") ||
    lower.includes("billing") ||
    lower.includes("credit") ||
    lower.includes("balance") ||
    lower.includes("account balance")
  );
}

function formatFieldError(params: {
  locale: string;
  fieldKey: FieldKey;
  error: unknown;
}): string {
  const baseMessage =
    params.error instanceof Error ? params.error.message : "Translation failed";

  if (isCreditInsufficientError(params.error)) {
    return `[CREDIT_INSUFFICIENT] ${params.locale} / ${params.fieldKey}: ${baseMessage}`;
  }

  return `[TRANSLATION_FAILED] ${params.locale} / ${params.fieldKey}: ${baseMessage}`;
}

async function cancelPaymentIntentFromSession(sessionId: string) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session.payment_intent || typeof session.payment_intent !== "string") {
    throw new Error("PaymentIntent not found on Checkout Session");
  }

  return await stripe.paymentIntents.cancel(session.payment_intent);
}

async function capturePaymentIntentFromSession(sessionId: string) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session.payment_intent || typeof session.payment_intent !== "string") {
    throw new Error("PaymentIntent not found on Checkout Session");
  }

  return await stripe.paymentIntents.capture(session.payment_intent);
}

async function translateTitleForContext(params: {
  sourceLocale: string;
  targetLocale: string;
  sourceTitle: string;
}) {
  const { sourceLocale, targetLocale, sourceTitle } = params;

  if (!sourceTitle.trim()) return "";

  const translated = await translateWithinLimit({
    sourceLocale,
    targetLocale,
    fieldKey: "title",
    text: sourceTitle.trim(),
    limit: FIELD_LIMITS.title,
  });

  if (translated.error || !translated.text.trim()) {
    return "";
  }

  return translated.text.trim();
}

async function runJob(body: StartBody, jobId: string) {
  try {
    const { sourceLocale, sourceFields, purchasedPlan, sessionId } = body;
    const targetLocales = purchasedPlan.selectedLocales;
    const targetFields = orderTargetFields(
      getTargetFields(purchasedPlan, sourceFields)
    );

    const sourceTitle = sourceFields.title.trim();
    const results: Record<string, LocaleFields> = {};
    const fieldErrors: string[] = [];

    let done = 0;
    const total = targetLocales.length * targetFields.length;
    let creditInsufficientDetected = false;

    for (const locale of targetLocales) {
      const localeResult = getEmptyLocaleFields();
      let translatedTitleForContext = "";

      if (sourceTitle && !targetFields.includes("title")) {
        try {
          translatedTitleForContext = await translateTitleForContext({
            sourceLocale,
            targetLocale: locale,
            sourceTitle,
          });
        } catch (error) {
          console.error(`hidden title context translation failed: ${locale}`, error);

          if (isCreditInsufficientError(error)) {
            fieldErrors.push(
              formatFieldError({
                locale,
                fieldKey: "title",
                error,
              })
            );
            creditInsufficientDetected = true;
            results[locale] = localeResult;
            break;
          }
        }
      }

      for (const fieldKey of targetFields) {
        const sourceText = sourceFields[fieldKey].trim();

        if (!sourceText) {
          done += 1;
          await updateJob(jobId, {
            done,
            progressLabel: `${locale} / ${FIELD_LABELS[fieldKey]}`,
          });
          continue;
        }

        await updateJob(jobId, {
          progressLabel: `${locale} / ${FIELD_LABELS[fieldKey]}`,
        });

        try {
          const translated = await translateWithinLimit({
            sourceLocale,
            targetLocale: locale,
            fieldKey,
            text: sourceText,
            limit: FIELD_LIMITS[fieldKey],
            context:
              shouldUseTitleContext(fieldKey) &&
              sourceTitle &&
              translatedTitleForContext
                ? {
                    sourceTitle,
                    translatedTitle: translatedTitleForContext,
                  }
                : undefined,
          });

          localeResult[fieldKey] = {
            text: translated.text,
            warning: translated.warning,
            error: translated.error,
          };

          if (fieldKey === "title" && translated.text.trim()) {
            translatedTitleForContext = translated.text.trim();
          }

          if (translated.error) {
            fieldErrors.push(
              `[TRANSLATION_ERROR_FALLBACK] ${locale} / ${fieldKey}: returned English fallback`
            );
          }
        } catch (error) {
          const formatted = formatFieldError({ locale, fieldKey, error });
          console.error(`translate failed: ${locale} / ${fieldKey}`, error);

          fieldErrors.push(formatted);
          localeResult[fieldKey] = getErrorTranslatedField();

          if (isCreditInsufficientError(error)) {
            creditInsufficientDetected = true;
            break;
          }
        }

        done += 1;
        await updateJob(jobId, {
          done,
          progressLabel: `${locale} / ${FIELD_LABELS[fieldKey]}`,
        });
      }

      results[locale] = localeResult;

      if (creditInsufficientDetected) {
        break;
      }
    }

    const result: TranslationJobResult = {
      sourceLocale,
      sourceFields,
      purchasedPlan,
      results,
    };

    if (creditInsufficientDetected) {
      let cancelErrorMessage = "";

      if (sessionId) {
        try {
          await cancelPaymentIntentFromSession(sessionId);
        } catch (cancelError) {
          console.error("payment_intent cancel failed:", cancelError);
          cancelErrorMessage =
            cancelError instanceof Error
              ? cancelError.message
              : "Payment cancel failed";
        }
      } else {
        cancelErrorMessage = "sessionId is missing";
      }

      await updateJob(jobId, {
        status: "failed",
        done,
        progressLabel: "credit_insufficient",
        result,
        error: [
          "CREDIT_INSUFFICIENT",
          fieldErrors.join("\n"),
          cancelErrorMessage ? `PAYMENT_CANCEL_FAILED: ${cancelErrorMessage}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      });
      return;
    }

    if (!sessionId) {
      await updateJob(jobId, {
        status: "failed",
        done,
        progressLabel: "capture_failed",
        result,
        error: "PAYMENT_CAPTURE_FAILED: sessionId is missing",
      });
      return;
    }

    try {
      await capturePaymentIntentFromSession(sessionId);
    } catch (captureError) {
      console.error("payment_intent capture failed:", captureError);

      await updateJob(jobId, {
        status: "failed",
        done,
        progressLabel: "capture_failed",
        result,
        error: `PAYMENT_CAPTURE_FAILED: ${
          captureError instanceof Error
            ? captureError.message
            : "Payment capture failed"
        }`,
      });
      return;
    }

    await updateJob(jobId, {
      status: "completed",
      done: total,
      progressLabel: "completed",
      result,
      error: fieldErrors.length > 0 ? fieldErrors.join("\n") : undefined,
    });
  } catch (error) {
    console.error("translate-job failed:", error);
    await failJob(
      jobId,
      error instanceof Error ? error.message : "Translation failed"
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await cleanupOldJobs();

    if (process.env.TRANSLATION_SERVICE_ENABLED !== "true") {
      return NextResponse.json(
        { error: "Translation service is currently disabled" },
        { status: 503 }
      );
    }

    const body = (await req.json()) as Partial<StartBody>;

    const sourceLocale =
      typeof body.sourceLocale === "string" ? body.sourceLocale.trim() : "";

    const sourceFields =
      body.sourceFields && typeof body.sourceFields === "object"
        ? (body.sourceFields as Partial<SourceLocaleFields>)
        : null;

    const purchasedPlan =
      body.purchasedPlan && typeof body.purchasedPlan === "object"
        ? body.purchasedPlan
        : null;

    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim() : "";

    if (!sourceLocale || !sourceFields || !purchasedPlan) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const selectedLocales = Array.isArray(purchasedPlan.selectedLocales)
      ? purchasedPlan.selectedLocales.filter(
          (x): x is string => typeof x === "string" && x.trim().length > 0
        )
      : [];

    if (selectedLocales.length === 0) {
      return NextResponse.json(
        { error: "No target locales selected" },
        { status: 400 }
      );
    }

    const normalizedSourceFields = {
      title: typeof sourceFields.title === "string" ? sourceFields.title : "",
      subtitle:
        typeof sourceFields.subtitle === "string" ? sourceFields.subtitle : "",
      promotionalText:
        typeof sourceFields.promotionalText === "string"
          ? sourceFields.promotionalText
          : "",
      description:
        typeof sourceFields.description === "string"
          ? sourceFields.description
          : "",
      keywords:
        typeof sourceFields.keywords === "string" ? sourceFields.keywords : "",
      whatsNew:
        typeof sourceFields.whatsNew === "string" ? sourceFields.whatsNew : "",
      iapDisplayName:
        typeof sourceFields.iapDisplayName === "string"
          ? sourceFields.iapDisplayName
          : "",
      iapDescription:
        typeof sourceFields.iapDescription === "string"
          ? sourceFields.iapDescription
          : "",
      subscriptionGroupDisplayName:
        typeof sourceFields.subscriptionGroupDisplayName === "string"
          ? sourceFields.subscriptionGroupDisplayName
          : "",
      subscriptionCustomName:
        typeof sourceFields.subscriptionCustomName === "string"
          ? sourceFields.subscriptionCustomName
          : "",
    } satisfies SourceLocaleFields;

    const normalizedPurchasedPlan = {
      mode: purchasedPlan.mode === "single" ? "single" : "all",
      fieldKey: isFieldKey(purchasedPlan.fieldKey)
        ? purchasedPlan.fieldKey
        : null,
      planId:
        typeof purchasedPlan.planId === "string" ? purchasedPlan.planId : "",
      planName:
        typeof purchasedPlan.planName === "string" ? purchasedPlan.planName : "",
      count:
        purchasedPlan.count === 3 ||
        purchasedPlan.count === 10 ||
        purchasedPlan.count === "all"
          ? purchasedPlan.count
          : "all",
      countLabel:
        typeof purchasedPlan.countLabel === "string"
          ? purchasedPlan.countLabel
          : "",
      price: typeof purchasedPlan.price === "string" ? purchasedPlan.price : "",
      selectedLocales,
    } as StartBody["purchasedPlan"];

    const targetFields = getTargetFields(
      normalizedPurchasedPlan,
      normalizedSourceFields
    );

    if (targetFields.length === 0) {
      return NextResponse.json(
        { error: "No source text to translate" },
        { status: 400 }
      );
    }

    const total = selectedLocales.length * targetFields.length;

    const job = await createJob({
      total,
      progressLabel: "starting",
    });

    void runJob(
      {
        sourceLocale,
        sourceFields: normalizedSourceFields,
        purchasedPlan: normalizedPurchasedPlan,
        sessionId,
      },
      job.jobId
    );

    return NextResponse.json({
      jobId: job.jobId,
    });
  } catch (error) {
    console.error("translate-job start error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start translation",
      },
      { status: 500 }
    );
  }
}