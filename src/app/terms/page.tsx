'use client';

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-white">Terms and Conditions</h1>
      
      <div className="space-y-6 text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">1. Acceptance of Terms</h2>
          <p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">2. Use License</h2>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Permission is granted to temporarily stream music for personal, non-commercial use only.</li>
            <li>This license shall automatically terminate if you violate any of these restrictions.</li>
            <li>Upon termination, you must destroy any downloaded materials in your possession.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">3. User Account</h2>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>You are responsible for maintaining the confidentiality of your account.</li>
            <li>You agree to accept responsibility for all activities that occur under your account.</li>
            <li>You must be 13 years or older to use this service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">4. Content Usage</h2>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>All content is owned by their respective rights holders.</li>
            <li>You may not download, copy, or share content without permission.</li>
            <li>Streaming is allowed only through our official platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">5. Prohibited Activities</h2>
          <p>You may not:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Use the service for any illegal purpose</li>
            <li>Attempt to bypass any security measures</li>
            <li>Share your account credentials</li>
            <li>Use automated systems to access the service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">6. Service Modifications</h2>
          <p>We reserve the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Modify or discontinue the service at any time</li>
            <li>Change features or functionality</li>
            <li>Update these terms and conditions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">7. Limitation of Liability</h2>
          <p>We shall not be liable for:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Any indirect, consequential, or incidental damages</li>
            <li>Service interruptions or data loss</li>
            <li>Actions of third-party service providers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">8. Governing Law</h2>
          <p>These terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">9. Contact Information</h2>
          <p>For any questions regarding these terms, please contact us at:</p>
          <p className="mt-2">Email: legal@youtubemusic.com</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">10. Changes to Terms</h2>
          <p>We reserve the right to update these terms at any time. We will notify users of any material changes by posting a notice on our website.</p>
          <p className="mt-4">Last Updated: January 5, 2025</p>
        </section>
      </div>
    </div>
  );
}