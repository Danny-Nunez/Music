'use client';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-white">Privacy Policy</h1>
      
      <div className="space-y-6 text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Create an account</li>
            <li>Create or modify playlists</li>
            <li>Use our music streaming services</li>
            <li>Contact us for support</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Provide and maintain our services</li>
            <li>Personalize your experience</li>
            <li>Improve our services</li>
            <li>Communicate with you about service-related issues</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">3. Information Sharing</h2>
          <p>We do not sell or rent your personal information to third parties. We may share your information:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and prevent abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">4. Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information, including:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments</li>
            <li>Access controls and authentication</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">6. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p className="mt-2">Email: privacy@youtubemusic.com</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">7. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &ldquo;Last Updated&rdquo; date.</p>
          <p className="mt-4">Last Updated: January 5, 2025</p>
        </section>
      </div>
    </div>
  );
}