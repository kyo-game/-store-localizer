import { NextResponse } from "next/server";

export async function GET() {
  try {
    const enabled = process.env.TRANSLATION_SERVICE_ENABLED === "true";

    return NextResponse.json({
      enabled,
      unavailableReason: enabled ? null : "SERVICE_DISABLED",
    });
  } catch (error) {
    console.error("service-status route error:", error);

    return NextResponse.json(
      {
        enabled: false,
        unavailableReason: "SERVICE_STATUS_ERROR",
      },
      { status: 500 }
    );
  }
}