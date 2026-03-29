import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — The Full Collection",
  description: "Privacy Policy for The Full Collection client portal.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-12 font-body text-text sm:px-6">
      <div className="mx-auto max-w-[800px]">
        {/* Logo */}
        <p className="mb-8 text-center font-heading text-sm font-bold tracking-[0.3em] text-red">
          THE FULL COLLECTION
        </p>

        <h1 className="mb-2 font-heading text-3xl font-bold text-text sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mb-10 text-sm text-text-2">Last updated: March 29, 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-text-2">
          {/* 1 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              1. Information We Collect
            </h2>
            <p className="mb-3">
              We collect the following types of information when you use The Full Collection
              (&quot;TFC&quot;) client portal:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-text">Account Information:</strong> Name, email address,
                and profile details you provide when creating an account.
              </li>
              <li>
                <strong className="text-text">Content Data:</strong> Files, media, captions,
                schedules, and other content you upload or create within the Service.
              </li>
              <li>
                <strong className="text-text">Social Media Tokens:</strong> Encrypted OAuth access
                tokens for connected social media accounts (Instagram, TikTok, YouTube, Facebook).
              </li>
              <li>
                <strong className="text-text">Usage Data:</strong> Information about how you
                interact with the Service, including pages visited, features used, and timestamps.
              </li>
              <li>
                <strong className="text-text">Billing Information:</strong> Payment details
                processed through Stripe. TFC does not directly store credit card numbers.
              </li>
            </ul>
          </section>

          {/* 2 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              2. How We Use Your Information
            </h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Manage and deliver content production services on your behalf.</li>
              <li>
                Post, schedule, and analyze content across your connected social media accounts.
              </li>
              <li>Provide analytics and performance insights for your content.</li>
              <li>Process billing and manage your subscription.</li>
              <li>Communicate with you about your account, service updates, and support.</li>
              <li>Improve the Service and develop new features.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              3. Third-Party Services
            </h2>
            <p className="mb-3">
              TFC integrates with the following third-party services to deliver functionality.
              Each service has its own privacy policy governing the data it processes:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-text">Supabase:</strong> Database hosting, authentication,
                and file storage.
              </li>
              <li>
                <strong className="text-text">Stripe:</strong> Payment processing and subscription
                management.
              </li>
              <li>
                <strong className="text-text">Google (Drive, YouTube):</strong> File access and
                video publishing via Google APIs.
              </li>
              <li>
                <strong className="text-text">Meta (Facebook, Instagram):</strong> Social media
                account management and content publishing.
              </li>
              <li>
                <strong className="text-text">TikTok:</strong> Social media account management and
                content publishing.
              </li>
              <li>
                <strong className="text-text">Anthropic AI:</strong> AI-assisted features within the
                Service.
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              4. Social Media Account Data
            </h2>
            <p>
              When you connect a social media account, we store encrypted OAuth tokens that allow
              the Service to act on your behalf. We access account profile information, post
              metrics, audience insights, and content necessary to provide our services. We do not
              access private messages or data unrelated to content management. You may disconnect
              any social media account at any time, which will revoke our access and delete the
              associated tokens from our systems.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              5. Data Storage and Security
            </h2>
            <p>
              Your data is stored on Supabase infrastructure with encryption at rest and in
              transit. We enforce row-level security (RLS) policies at the database level to ensure
              users can only access data they are authorized to view. All communication between
              your browser and our servers occurs over HTTPS. OAuth tokens for third-party services
              are encrypted before storage. While we employ industry-standard security practices,
              no system is completely immune to risk, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              6. Data Retention
            </h2>
            <p>
              We retain your account data for as long as your account remains active. If you
              request account deletion, we will remove your personal data and associated content
              within 30 days, except where retention is required by law or for legitimate business
              purposes (such as resolving disputes or enforcing agreements). Aggregated,
              anonymized data may be retained indefinitely for analytical purposes.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              7. Your Rights
            </h2>
            <p className="mb-3">
              Depending on your jurisdiction, you may have the following rights regarding your
              personal data:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-text">Access:</strong> Request a copy of the personal data
                we hold about you.
              </li>
              <li>
                <strong className="text-text">Correction:</strong> Request correction of inaccurate
                or incomplete data.
              </li>
              <li>
                <strong className="text-text">Deletion:</strong> Request deletion of your personal
                data, subject to legal retention requirements.
              </li>
              <li>
                <strong className="text-text">Data Portability:</strong> Request an export of your
                data in a structured, machine-readable format.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at{" "}
              <a
                href="mailto:hello@thefullcollection.com"
                className="text-red underline underline-offset-2 hover:opacity-80"
              >
                hello@thefullcollection.com
              </a>
              .
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              8. Cookies
            </h2>
            <p>
              The Service uses session cookies for authentication and maintaining your login state.
              These cookies are essential for the Service to function and cannot be disabled. We do
              not use advertising or third-party tracking cookies.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              9. Children&apos;s Privacy
            </h2>
            <p>
              The Service is not directed at children under the age of 13. We do not knowingly
              collect personal information from children under 13. If we become aware that we have
              inadvertently collected such information, we will take steps to delete it promptly.
              If you believe a child under 13 has provided us with personal information, please
              contact us at{" "}
              <a
                href="mailto:hello@thefullcollection.com"
                className="text-red underline underline-offset-2 hover:opacity-80"
              >
                hello@thefullcollection.com
              </a>
              .
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              10. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be
              communicated through the Service or via email. Your continued use of the Service
              after any changes constitutes acceptance of the updated policy. We encourage you to
              review this page periodically.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              11. Contact
            </h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please
              contact us at{" "}
              <a
                href="mailto:hello@thefullcollection.com"
                className="text-red underline underline-offset-2 hover:opacity-80"
              >
                hello@thefullcollection.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
