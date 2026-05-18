// app/api/translate-job/_store.ts

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

const jobs = new Map<string, TranslationJobState>();

function now() {
  return Date.now();
}

export function createJob(params: {
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

  jobs.set(jobId, job);
  return job;
}

export function getJob(jobId: string) {
  return jobs.get(jobId) ?? null;
}

export function updateJob(
  jobId: string,
  patch: Partial<Omit<TranslationJobState, "jobId" | "createdAt">>
) {
  const current = jobs.get(jobId);
  if (!current) return null;

  const next: TranslationJobState = {
    ...current,
    ...patch,
    updatedAt: now(),
  };

  jobs.set(jobId, next);
  return next;
}

export function completeJob(jobId: string, result: TranslationJobResult) {
  const current = jobs.get(jobId);
  if (!current) return null;

  return updateJob(jobId, {
    status: "completed",
    done: current.total,
    result,
    error: undefined,
    progressLabel: "completed",
  });
}

export function failJob(jobId: string, error: string) {
  return updateJob(jobId, {
    status: "failed",
    error,
  });
}

export function deleteJob(jobId: string) {
  jobs.delete(jobId);
}

export function cleanupOldJobs(maxAgeMs = 1000 * 60 * 60) {
  const cutoff = now() - maxAgeMs;

  for (const [jobId, job] of jobs.entries()) {
    if (job.updatedAt < cutoff) {
      jobs.delete(jobId);
    }
  }
}