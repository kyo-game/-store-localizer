import { NextResponse } from "next/server";
import Stripe from "stripe";
import { mkdir, appendFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

if (!stripeWebhookSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET");
}

const webhookSecretString: string = stripeWebhookSecret;

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-03-25.dahlia",
});

type PurchaseLog = {
  type: string;
  createdAt: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  customerEmail: string | null;
  amountTotal: number | null;
  currency: string | null;
  paymentStatus: string | null;
  customerDetails: Stripe.Checkout.Session["customer_details"];
  metadata: Record<string, string>;
};

async function savePurchaseLog(data: PurchaseLog) {
  const dir = path.join(process.cwd(), "data");
  const filePath = path.join(dir, "purchase-log.jsonl");

  await mkdir(dir, { recursive: true });
  await appendFile(filePath, JSON.stringify(data) + "\n", "utf8");
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const body = await req.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecretString
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Webhook signature verification failed";

      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const log: PurchaseLog = {
        type: event.type,
        createdAt: new Date().toISOString(),
        checkoutSessionId: session.id,
        paymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        customerEmail:
          session.customer_details?.email ??
          (typeof session.customer_email === "string"
            ? session.customer_email
            : null),
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? null,
        paymentStatus: session.payment_status ?? null,
        customerDetails: session.customer_details ?? null,
        metadata: session.metadata ?? {},
      };

      await savePurchaseLog(log);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}