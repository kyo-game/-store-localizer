export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="mt-3 text-sm text-zinc-400">Last updated: 2026-04-14</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-zinc-200">
          <section>
            <h2 className="text-xl font-semibold">Article 1 (Application)</h2>
            <p className="mt-3">
              These Terms of Service ("Terms") set forth the conditions for using
              StoreLocalizer ("the Service"). Users shall use the Service only after
              agreeing to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Article 2 (Service Content)</h2>
            <p className="mt-3">
              The Service provides functions such as translation of app store listing text,
              character limit checking, and saving/exporting related data.
            </p>
            <p className="mt-3">
              The content of the Service may be changed, added, suspended, or terminated
              without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Article 3 (Account and User Environment)</h2>
            <p className="mt-3">
              Users shall use the Service at their own responsibility and shall prepare
              their own device, internet connection, browser, and any other necessary
              environment for use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Article 4 (Fees and Payment)</h2>
            <p className="mt-3">
              Paid plans, prices, and payment methods for the Service shall be as displayed
              on the Service.
            </p>
            <p className="mt-3">
              Users shall pay fees in accordance with the methods specified by the payment provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Article 5 (Refunds)</h2>
            <p className="mt-3">
              Due to the nature of digital services, refunds, cancellations, and exchanges
              after purchase are generally not accepted except where required by law.
            </p>
            <p className="mt-3">
              However, we may respond on a case-by-case basis in the event of a serious defect
              in the Service or where we otherwise deem it appropriate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Article 6 (Prohibited Acts)</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Acts that violate laws or public order and morals</li>
              <li>Criminal acts or acts related thereto</li>
              <li>Acts that interfere with the operation of the Service</li>
              <li>Unauthorized access, excessive requests, or acts that impose an excessive load on the system</li>
              <li>Acts that infringe the rights, interests, reputation, credit, or privacy of third parties</li>
              <li>Acts of using the Service for unlawful or inappropriate purposes</li>
              <li>Acts of reselling the output of the Service as-is or in substantially the same form</li>
              <li>Any other acts that we consider inappropriate</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Article 7 (Intellectual Property Rights)</h2>
            <p className="mt-3">
              All rights related to the Service, including programs, screen designs, logos,
              and text, belong to us or the rightful rights holders.
            </p>
            <p className="mt-3">
              Rights to text entered by users shall, in principle, belong to the relevant
              user or the rightful rights holder.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Article 8 (Output Results)</h2>
            <p className="mt-3">
              The Service does not guarantee translation results, compliance with character limits,
              accuracy of expressions, legal compliance, or approval in app review.
            </p>
            <p className="mt-3">
              Users shall review and, if necessary, modify the content at their own responsibility
              before publishing, submitting, distributing, or otherwise using it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Article 9 (Service Suspension and Changes)</h2>
            <p className="mt-3">
              We may suspend or interrupt all or part of the Service without prior notice
              when necessary for maintenance, issue response, external service failures,
              or other operational reasons.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Article 10 (Disclaimer)</h2>
            <p className="mt-3">
              We do not guarantee that the Service is free from factual or legal defects.
            </p>
            <p className="mt-3">
              We shall not be liable for any damages incurred by users due to the use or inability
              to use the Service, except in cases of willful misconduct or gross negligence on our part.
            </p>
            <p className="mt-3">
              Even where we are liable, our liability shall be limited to the amount paid by the user
              to the Service in the most recent month in which the damage occurred.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Article 11 (Changes to the Terms)</h2>
            <p className="mt-3">
              We may modify these Terms when we deem it necessary. The revised Terms shall become
              effective when posted on the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Article 12 (Governing Law and Jurisdiction)</h2>
            <p className="mt-3">
              These Terms shall be governed by the laws of Japan.
            </p>
            <p className="mt-3">
              In the event of any dispute concerning the Service, the court having jurisdiction
              over our location shall have exclusive jurisdiction as the court of first instance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Business Information</h2>
            <p className="mt-3">
              The business name, address, and contact information are provided on the Legal Notice page.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}