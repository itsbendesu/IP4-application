import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Interesting People",
  description: "How we handle your data and video submissions",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Collect</h2>
            <p className="text-gray-700 mb-4">
              When you apply, we collect the following information:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Contact information:</strong> Name, email address, location, and timezone</li>
              <li><strong>Profile information:</strong> A short bio and optional links you provide</li>
              <li><strong>Video submission:</strong> A video response to one of our prompts (up to 90 seconds)</li>
              <li><strong>Technical data:</strong> IP address and submission timestamp for security purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Your Data</h2>
            <p className="text-gray-700 mb-4">Your information is used to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Review your application:</strong> Our team watches your video to evaluate your application</li>
              <li><strong>Contact you:</strong> To communicate our decision and event details if accepted</li>
              <li><strong>Prevent abuse:</strong> To detect spam and protect the integrity of our application process</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Handling</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-gray-700">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Videos are stored securely on Cloudflare R2 (encrypted at rest)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Videos are only viewable by our review team</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Videos are never shared publicly or with third parties</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Videos from rejected applications are deleted after 90 days</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Internal Review Process</h2>
            <p className="text-gray-700 mb-4">
              Your application is reviewed by our team using the following process:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Each application is watched by at least one human reviewer</li>
              <li>Reviewers score applications on curiosity, participation, and emotional intelligence</li>
              <li>Scores and notes are used internally to make acceptance decisions</li>
              <li>Review data is not shared outside our organization</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Accepted applicants:</strong> Data retained for the duration of your participation plus 1 year</li>
              <li><strong>Waitlisted applicants:</strong> Data retained for 1 year for potential future consideration</li>
              <li><strong>Rejected applicants:</strong> Data deleted within 90 days of rejection</li>
              <li><strong>Incomplete applications:</strong> Deleted after 24 hours</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
              <li><strong>Withdrawal:</strong> Withdraw your application at any time before a decision is made</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, contact us by replying to your application confirmation email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Security</h2>
            <p className="text-gray-700">
              We implement appropriate technical and organizational measures to protect your data,
              including encryption in transit (TLS) and at rest, access controls, and secure
              authentication for our review team.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this policy from time to time. Significant changes will be communicated
              via email to applicants with active applications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
            <p className="text-gray-700">
              For privacy-related questions or concerns, please contact us by replying to your
              application confirmation email or emailing our team directly.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
