import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — The Full Collection",
  description: "Terms of Service for The Full Collection client portal.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-12 font-body text-text sm:px-6">
      <div className="mx-auto max-w-[800px]">
        {/* Logo */}
        <p className="mb-8 text-center font-heading text-sm font-bold tracking-[0.3em] text-red">
          THE FULL COLLECTION
        </p>

        <h1 className="mb-2 font-heading text-3xl font-bold text-text sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mb-10 text-sm text-text-2">Last updated: March 29, 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-text-2">
          {/* 1 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using The Full Collection (&quot;TFC&quot;) client portal (the
              &quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not
              agree to these terms, you may not use the Service. We reserve the right to update
              these terms at any time, and your continued use of the Service constitutes acceptance
              of any modifications.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              2. Description of Service
            </h2>
            <p>
              TFC is a content agency management portal designed for managing social media content
              production. The Service enables clients and team members to collaborate on content
              strategy, review deliverables, manage social media accounts, access files, and handle
              billing in a centralized platform.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              3. User Accounts
            </h2>
            <p>
              The Service supports two primary account types: client accounts and team member
              accounts. You are responsible for maintaining the confidentiality of your login
              credentials and for all activity that occurs under your account. You agree to notify
              TFC immediately of any unauthorized use of your account or any other breach of
              security. TFC will not be liable for any loss arising from your failure to protect
              your account credentials.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              4. Social Media Account Access
            </h2>
            <p>
              By connecting your social media accounts (including but not limited to Instagram,
              TikTok, YouTube, and Facebook) to the Service, you authorize TFC to access, manage,
              and post content on your behalf through those accounts. You may revoke this
              authorization at any time by disconnecting your accounts from the Service. TFC will
              only access your social media accounts in accordance with the permissions you grant
              and for the purpose of delivering content production services.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              5. Content and Intellectual Property
            </h2>
            <p>
              All content created for or provided by a client remains the intellectual property of
              that client unless otherwise agreed upon in a separate written agreement. TFC manages
              the production, scheduling, and distribution of content on behalf of clients but does
              not claim ownership of client content. TFC retains the right to showcase work in its
              portfolio unless the client requests otherwise in writing.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              6. Google Drive Integration
            </h2>
            <p>
              The Service integrates with Google Drive to allow you to access and manage files
              related to your content production. TFC accesses your Google Drive files only with
              your explicit permission and does not store the contents of your files on its servers.
              File metadata (such as names, IDs, and folder structure) may be cached to improve
              performance. You may revoke Google Drive access at any time through your Google
              account settings.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              7. Billing and Payments
            </h2>
            <p>
              Billing for the Service is processed through Stripe, a third-party payment processor.
              By subscribing to a paid plan, you agree to provide accurate billing information and
              authorize TFC to charge your payment method on a recurring basis according to your
              subscription terms. All fees are non-refundable unless otherwise stated. TFC reserves
              the right to modify pricing with reasonable advance notice. Failure to maintain a
              valid payment method may result in suspension or termination of your account.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              8. Data Storage and Security
            </h2>
            <p>
              TFC takes the security of your data seriously. Authentication tokens for connected
              services are encrypted before storage. The Service is hosted on Supabase
              infrastructure with row-level security policies enforced at the database level. All
              data is transmitted over HTTPS. While we implement industry-standard security
              measures, no method of electronic storage is 100% secure, and we cannot guarantee
              absolute security.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              9. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, TFC and its officers, directors,
              employees, and agents shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, or any loss of profits or revenues, whether
              incurred directly or indirectly, or any loss of data, use, goodwill, or other
              intangible losses resulting from (a) your use of or inability to use the Service;
              (b) any unauthorized access to or use of our servers and/or any personal information
              stored therein; (c) any interruption or cessation of transmission to or from the
              Service; or (d) any bugs, viruses, or similar issues transmitted through the Service
              by any third party.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              10. Termination
            </h2>
            <p>
              Either party may terminate the use of the Service at any time. TFC reserves the right
              to suspend or terminate your account if you violate these Terms of Service or engage
              in conduct that TFC determines, in its sole discretion, is harmful to other users, to
              TFC, or to third parties. Upon termination, your right to access the Service will
              cease immediately. TFC may retain certain data as required by law or for legitimate
              business purposes.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              11. Changes to Terms
            </h2>
            <p>
              TFC may revise these Terms of Service at any time by updating this page. Material
              changes will be communicated through the Service or via email. Your continued use of
              the Service following any changes constitutes your acceptance of the revised terms. We
              encourage you to review these terms periodically.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">
              12. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at{" "}
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
