import Link from "next/link";

export default function EnHowToPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight">How to Use</h1>
        <p className="mt-4 text-base text-white/70">
          Store Localizer is a tool for translating App Store and Google Play listing text into multiple languages while staying within character limits.
        </p>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">Basic Flow</h2>
          <ol className="mt-4 space-y-3 text-white/85">
            <li>1. Select your source language on the left and enter your original store text.</li>
            <li>2. Choose a plan and the languages you want to translate into.</li>
            <li>3. After checkout, translation starts automatically.</li>
            <li>4. When translation is complete, the results will appear on the right.</li>
            <li>5. Review each language tab and copy any field you want to use.</li>
            <li>6. Download and save the JSON file. You can upload it later to restore your translation results.</li>
          </ol>
        </section>

        <section className="mt-8 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-6">
          <h2 className="text-2xl font-semibold text-sky-300">Completion Time</h2>
          <ul className="mt-4 space-y-3 text-white/85">
            <li>- Completion time depends on the number of languages and the amount of source text.</li>
            <li>- Translating all fields into all languages may take several tens of minutes.</li>
            <li>- Progress is shown while translation is running. Please wait until it finishes.</li>
            <li>- Smaller plans or shorter input text usually finish faster.</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <h2 className="text-2xl font-semibold text-emerald-300">If You Close the Browser</h2>
          <ul className="mt-4 space-y-3 text-white/85">
            <li>- After translation starts, processing continues on the server even if you close the browser.</li>
            <li>- If you return with the same browser within 24 hours, you can resume the running job or restore completed results.</li>
            <li>- After 24 hours, the job may no longer be recoverable.</li>
            <li>- After completion, always download and save the JSON file.</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">Supported Fields</h2>
          <div className="mt-4 grid gap-3 text-white/85 sm:grid-cols-2">
            <div>- Title</div>
            <div>- Subtitle</div>
            <div>- Promotional Text</div>
            <div>- Description</div>
            <div>- Keywords</div>
            <div>- What&apos;s New</div>
            <div>- IAP Display Name</div>
            <div>- IAP Description</div>
            <div>- Subscription Group Display Name</div>
            <div>- Subscription Custom Name</div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
          <h2 className="text-2xl font-semibold text-yellow-300">Important Notes</h2>
          <ul className="mt-4 space-y-3 text-white/85">
            <li>- For short fields with strict character limits, preserving the limit is prioritized over keeping every nuance of the original text.</li>
            <li>- Some languages naturally become much longer than Japanese or English, so fully preserving tone and detail may be difficult.</li>
            <li>- Titles, subtitles, and short purchase labels may be compressed to fit the required limit.</li>
            <li>- In keyword fields, English keywords may remain if they are useful for search and are not treated as a problem.</li>
            <li>- Always review the final text yourself before publishing.</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="text-2xl font-semibold text-red-300">About warning and error</h2>

          <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
            <h3 className="text-lg font-semibold">warning</h3>
            <p className="mt-2 text-white/80">
              The translation is usable, but there may be slight awkwardness, compression, or minor meaning drift caused by character limits.
            </p>
            <ul className="mt-3 space-y-2 text-white/75">
              <li>- The wording feels slightly unnatural</li>
              <li>- Some detail was dropped to fit the limit</li>
              <li>- The meaning is mostly preserved, but the phrasing may need a quick check</li>
            </ul>
            <p className="mt-3 text-sm text-white/60">
              If you see a warning, review the result before using it publicly.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
            <h3 className="text-lg font-semibold">error</h3>
            <p className="mt-2 text-white/80">
              The result was judged unsafe to use as-is. In some cases, an English fallback may be returned instead.
            </p>
            <ul className="mt-3 space-y-2 text-white/75">
              <li>- The text could not fit naturally within the character limit</li>
              <li>- The ending looks cut off or unnatural</li>
              <li>- Another language or script was mixed into the result</li>
              <li>- The meaning drift became too large</li>
            </ul>
            <p className="mt-3 text-sm text-white/60">
              If you see an error, do not publish the result as-is. Please rewrite or adjust it manually.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">Common Cases</h2>
          <div className="mt-4 space-y-4 text-white/85">
            <div>
              <p className="font-medium">Q. Translation is taking a long time</p>
              <p className="mt-1 text-white/70">
                A. Translating all fields into many languages can take time. You can close the browser and return within 24 hours to resume or restore the job.
              </p>
            </div>
            <div>
              <p className="font-medium">Q. Is it okay to close the browser during translation?</p>
              <p className="mt-1 text-white/70">
                A. Yes, after translation has started. Processing continues on the server, and you can restore it within 24 hours using the same browser.
              </p>
            </div>
            <div>
              <p className="font-medium">Q. What should I do after translation is complete?</p>
              <p className="mt-1 text-white/70">
                A. Download and save the JSON file. You can upload it later to display the results again.
              </p>
            </div>
            <div>
              <p className="font-medium">Q. Why did one language come back in English?</p>
              <p className="mt-1 text-white/70">
                A. That usually means the tool could not produce a safe, natural result within the character limit for that language, so it fell back to English.
              </p>
            </div>
            <div>
              <p className="font-medium">Q. Do I always need to fix warnings?</p>
              <p className="mt-1 text-white/70">
                A. Not always, but you should still review them before publishing.
              </p>
            </div>
            <div>
              <p className="font-medium">Q. Are some languages harder than others?</p>
              <p className="mt-1 text-white/70">
                A. Yes. Very short fields such as titles, subtitles, and IAP names can be much harder depending on the target language.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-12 flex justify-center">
          <Link
            href="/en"
            className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}