// app/api/translate-job/_store.ts

import { Redis } from "@upstash/redis";

type JobStatus = "processing" | "completed" | "failed";

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

type SourceLocaleFields = Record<FieldKey, string>;
type LocaleFields = Record<FieldKey, TranslatedField>;

type PurchasedPlan = {
  mode: "single" | "all";
  fieldKey: FieldKey | null;
  planId: string;
  planName: string;
  count: 3 | 10 | "all";
  countLabel: string;
  price: string;
  selectedLocales: string[];
};

export type TranslationJobResult = {
  sourceLocale: string;
  sourceFields: SourceLocaleFields;
  purchasedPlan: PurchasedPlan;
  results: Record<string, LocaleFields>;
};

export type TranslationJobState = {
  jobId: string;
  status: JobStatus;
  done: number;
  total: number;
  progressLabel: string;
  error?: string;
  result?: TranslationJobResult;
  createdAt: number;
  updatedAt: number;
};

const redis = Redis.fromEnv();
const JOB_KEY_PREFIX = "store-localizer:translation-job:";
const JOB_TTL_SECONDS = 60 * 60 * 6;

function now() {
  return Date.now();
}

function jobKey(jobId: string) {
  return `${JOB_KEY_PREFIX}${jobId}`;
}

export async function createJob(params: {
  total: number;
  progressLabel?: string;
}) {
  const jobId = crypto.randomUUID();

  const job: TranslationJobState = {
    jobId,
    status: "processing",
    done: 0,
    total: params.total,
    progressLabel: params.progressLabel ?? "",
    createdAt: now(),
    updatedAt: now(),
  };

  await redis.set(jobKey(jobId), job, { ex: JOB_TTL_SECONDS });
  return job;
}

export async function getJob(jobId: string) {
  const job = await redis.get<TranslationJobState>(jobKey(jobId));
  return job ?? null;
}

export async function updateJob(
  jobId: string,
  patch: Partial<Omit<TranslationJobState, "jobId" | "createdAt">>
) {
  const current = await getJob(jobId);
  if (!current) return null;

  const next: TranslationJobState = {
    ...current,
    ...patch,
    updatedAt: now(),
  };

  await redis.set(jobKey(jobId), next, { ex: JOB_TTL_SECONDS });
  return next;
}

export async function completeJob(jobId: string, result: TranslationJobResult) {
  const current = await getJob(jobId);
  if (!current) return null;

  return updateJob(jobId, {
    status: "completed",
    done: current.total,
    result,
    error: undefined,
    progressLabel: "completed",
  });
}

export async function failJob(jobId: string, error: string) {
  return updateJob(jobId, {
    status: "failed",
    error,
  });
}

export async function deleteJob(jobId: string) {
  await redis.del(jobKey(jobId));
}

export async function cleanupOldJobs() {
  return;
}