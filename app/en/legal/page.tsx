export default function LegalPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">Legal Notice</h1>
        <p className="mt-3 text-sm text-zinc-400">Last updated: 2026-04-14</p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <div className="divide-y divide-zinc-800 text-sm">
            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">Business Name</div>
              <div className="text-zinc-100">KYO-GAME</div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">Representative</div>
              <div className="text-zinc-100">Kyoichi Watanabe</div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">Address</div>
              <div className="text-zinc-100">
                Available without delay upon request.
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">Phone Number</div>
              <div className="text-zinc-100">
                Available without delay upon request.
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">Email Address</div>
              <div className="text-zinc-100">kyogame.com@gmail.com</div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">Website URL</div>
              <div className="text-zinc-100">https://storelocalizer.com</div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">Sales Price</div>
              <div className="space-y-2 text-zinc-100">
                <p>The price displayed on each product page or checkout page.</p>
                <ul className="list-disc pl-5 text-zinc-300">
                  <li>Single Field Translation Lite / Standard / Pro</li>
                  <li>All Fields Translation Lite / Standard / Pro</li>
                </ul>
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">Additional Costs</div>
              <div className="text-zinc-100">
                Internet connection fees and communication charges are borne by the user.
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">Payment Method</div>
              <div className="text-zinc-100">
                Credit card or other payment methods shown at checkout.
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">Payment Timing</div>
              <div className="text-zinc-100">
                Payment is processed when the purchase procedure is completed.
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">Service Availability</div>
              <div className="text-zinc-100">
                The service becomes available after payment completion and the required processing is finished.
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">Returns / Cancellations</div>
              <div className="text-zinc-100">
                Due to the nature of digital services, returns, refunds, and cancellations after payment completion are generally not accepted except where required by law.
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">Recommended Environment</div>
              <div className="text-zinc-100">
                We recommend the latest versions of major browsers such as Chrome, Safari, and Edge.
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">Disclaimer</div>
              <div className="text-zinc-100">
                We do not guarantee translation results, compliance with character limits, or approval in app review. Please review all content yourself before publishing.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}