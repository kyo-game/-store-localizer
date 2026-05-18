import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

type PlanId =
  | "single_3"
  | "single_10"
  | "single_all"
  | "all_3"
  | "all_10"
  | "all_all";

type Currency = "jpy" | "usd";

type CheckoutBody = {
  planId: PlanId;
  planMode?: string;
  selectedField?: string;
  localeCount?: string;
  selectedLocales?: string;
};

const PLAN_PRICES: Record<
  PlanId,
  {
    nameJa: string;
    amountJpy: number;
    amountUsd: number;
  }
> = {
  single_3: {
    nameJa: "1フィールド翻訳 ライト",
    amountJpy: 150,
    amountUsd: 99,
  },
  single_10: {
    nameJa: "1フィールド翻訳 スタンダード",
    amountJpy: 390,
    amountUsd: 299,
  },
  single_all: {
    nameJa: "1フィールド翻訳 プロ",
    amountJpy: 860,
    amountUsd: 699,
  },
  all_3: {
    nameJa: "全フィールド翻訳 ライト",
    amountJpy: 590,
    amountUsd: 400,
  },
  all_10: {
    nameJa: "全フィールド翻訳 スタンダード",
    amountJpy: 1480,
    amountUsd: 999,
  },
  all_all: {
    nameJa: "全フィールド翻訳 プロ",
    amountJpy: 2980,
    amountUsd: 1999,
  },
};

function getBaseUrl(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  return "http://localhost:3000";
}

function detectCurrency(req: NextRequest): Currency {
  const acceptLanguage = (req.headers.get("accept-language") || "").toLowerCase();
  return acceptLanguage.startsWith("ja") ? "jpy" : "usd";
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY is not set" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as CheckoutBody;
    const { planId, planMode, selectedField, localeCount, selectedLocales } = body;

    if (!planId || !PLAN_PRICES[planId]) {
      return NextResponse.json(
        { error: "Invalid planId" },
        { status: 400 }
      );
    }

    const plan = PLAN_PRICES[planId];
    const currency = detectCurrency(req);
    const baseUrl = getBaseUrl(req);
    const unitAmount = currency === "jpy" ? plan.amountJpy : plan.amountUsd;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: plan.nameJa,
            },
          },
        },
      ],
      payment_intent_data: {
        capture_method: "manual",
        metadata: {
          planId,
          planName: plan.nameJa,
          planMode: planMode || "",
          selectedField: selectedField || "",
          localeCount: localeCount || "",
          selectedLocales: selectedLocales || "",
        },
      },
      success_url: `${baseUrl}/?checkout=success&planId=${planId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?checkout=cancel`,
      metadata: {
        planId,
        planName: plan.nameJa,
        planMode: planMode || "",
        selectedField: selectedField || "",
        localeCount: localeCount || "",
        selectedLocales: selectedLocales || "",
        captureMethod: "manual",
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("checkout route error:", error);

    const message =
      error instanceof Error ? error.message : "Checkout session creation failed";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}