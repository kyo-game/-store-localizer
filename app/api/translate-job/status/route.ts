import { NextRequest, NextResponse } from "next/server";
import { getJob } from "../_store";

type ErrorCode =
  | "CREDIT_INSUFFICIENT"
  | "TRANSLATION_FAILED"
  | "TRANSLATION_ERROR_FALLBACK"
  | null;

function getErrorCode(error: string | null | undefined): ErrorCode {
  if (!error) return null;

  if (
    error.includes("CREDIT_INSUFFICIENT") ||
    error.includes("[CREDIT_INSUFFICIENT]")
  ) {
    return "CREDIT_INSUFFICIENT";
  }

  if (
    error.includes("TRANSLATION_ERROR_FALLBACK") ||
    error.includes("[TRANSLATION_ERROR_FALLBACK]")
  ) {
    return "TRANSLATION_ERROR_FALLBACK";
  }

  if (
    error.includes("TRANSLATION_FAILED") ||
    error.includes("[TRANSLATION_FAILED]")
  ) {
    return "TRANSLATION_FAILED";
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const jobId = req.nextUrl.searchParams.get("jobId")?.trim() ?? "";

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing jobId" },
        { status: 400 }
      );
    }

    const job = getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      jobId: job.jobId,
      status: job.status,
      done: job.done,
      total: job.total,
      progressLabel: job.progressLabel,
      error: job.error ?? null,
      errorCode: getErrorCode(job.error),
      result: job.result ?? null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    console.error("translate-job status error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get job status",
      },
      { status: 500 }
    );
  }
}