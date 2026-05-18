export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-3 text-sm text-zinc-400">Last updated: 2026-04-14</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-zinc-200">
          <section>
            <h2 className="text-xl font-semibold">1. Basic Policy</h2>
            <p className="mt-3">
              StoreLocalizer ("the Service") respects user privacy and handles information,
              including personal information, appropriately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <p className="mt-3">
              The Service may collect the following information:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Text entered by users, settings, and translation target data</li>
              <li>Information necessary for payment processing, purchase history, and transaction information</li>
              <li>Access information such as usage date and time, referrer, browser type, device information, and IP address</li>
              <li>Usage information stored through cookies, local storage, and similar technologies</li>
              <li>Name, email address, and other contact information provided when making inquiries</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Purpose of Use</h2>
            <p className="mt-3">
              Collected information is used for the following purposes:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>To provide, maintain, and improve the Service</li>
              <li>To provide translation processing, saving, exporting, and purchase features</li>
              <li>To process payments, confirm purchases, and prevent fraud</li>
              <li>To respond to inquiries and provide support</li>
              <li>To respond to issues, improve quality, and analyze usage</li>
              <li>To address violations of terms, unauthorized access, abuse, and similar issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Use of Third-Party Services</h2>
            <p className="mt-3">
              The Service may use third-party services to provide functionality and process payments.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Translation API providers</li>
              <li>Payment processors</li>
              <li>External services for hosting, analytics, monitoring, and log management</li>
            </ul>
            <p className="mt-3">
              Information may be transmitted to these third-party services to the extent necessary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Use of Cookies and Similar Technologies</h2>
            <p className="mt-3">
              The Service may use cookies, local storage, and similar technologies to improve convenience,
              maintain login status, and analyze usage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Provision to Third Parties</h2>
            <p className="mt-3">
              We do not provide personal information to third parties without the user's consent,
              except as required by law.
            </p>
            <p className="mt-3">
              However, information may be provided to external service providers to the extent necessary
              for payment processing, external API use, and outsourced operations required to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Data Retention Period</h2>
            <p className="mt-3">
              We retain collected information for the period necessary to achieve the purposes of use,
              and afterwards delete or anonymize unnecessary information by reasonable methods.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Security</h2>
            <p className="mt-3">
              We take reasonable security measures to prevent leakage, loss, damage, and unauthorized access.
            </p>
            <p className="mt-3">
              However, due to the nature of internet communications and systems, complete security cannot be guaranteed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. User Rights</h2>
            <p className="mt-3">
              In accordance with applicable laws, users may request disclosure, correction, deletion,
              suspension of use, and similar actions regarding their personal information.
            </p>
            <p className="mt-3">
              If you wish to make such a request, please contact us through the designated contact method.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Children's Use</h2>
            <p className="mt-3">
              The Service is not intended for users who should not provide personal information without parental consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Changes to This Policy</h2>
            <p className="mt-3">
              We may change this policy as necessary. Any changes take effect when posted on the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">12. Contact</h2>
            <p className="mt-3">
              For inquiries regarding this policy, please contact us through the contact information separately provided by us.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}