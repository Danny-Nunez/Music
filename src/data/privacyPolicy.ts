export interface PrivacyPolicySection {
  id: string;
  title: string;
  content: string;
  items?: string[];
}

export interface PrivacyPolicyData {
  title: string;
  lastUpdated: string;
  sections: PrivacyPolicySection[];
}

export const privacyPolicyData: PrivacyPolicyData = {
  title: "Privacy Policy",
  lastUpdated: "January 5, 2025",
  sections: [
    {
      id: "information-we-collect",
      title: "Information We Collect",
      content: "We collect information you provide directly to us when you:",
      items: [
        "Create an account (email address, name, password)",
        "Create or modify playlists (playlist names, song selections)",
        "Use our music streaming services (play history, preferences)",
        "Contact us for support (messages, device information)"
      ]
    },
    {
      id: "automatic-data-collection",
      title: "Automatic Data Collection",
      content: "We automatically collect certain information when you use our app:",
      items: [
        "Device identifiers (device model, operating system version)",
        "Usage data (app launches, feature usage, session duration)",
        "Performance data (crash logs, loading times)",
        "Location data (only if you grant permission for location-based features)",
        "IP addresses (for security and analytics purposes)"
      ]
    },
    {
      id: "third-party-services",
      title: "Third-Party Services",
      content: "Our app integrates with third-party services that may collect additional data:",
      items: [
        "YouTube Music API (for music content and metadata)",
        "Google Analytics (for usage analytics and performance monitoring)",
        "Authentication providers (Google Sign-In for account creation)",
        "Cloud storage services (for playlist synchronization)"
      ]
    },
    {
      id: "how-we-use-information",
      title: "How We Use Your Information",
      content: "We use the information we collect to:",
      items: [
        "Provide and maintain our music streaming services",
        "Personalize your music experience and recommendations",
        "Improve our app performance and user experience",
        "Communicate with you about service-related issues",
        "Ensure app security and prevent fraud",
        "Comply with legal obligations"
      ]
    },
    {
      id: "legal-basis",
      title: "Legal Basis for Processing",
      content: "We process your personal data based on the following legal grounds:",
      items: [
        "Contractual necessity: To provide our music streaming services",
        "Legitimate interests: To improve our services and ensure security",
        "Consent: For optional features like location-based recommendations",
        "Legal compliance: To meet regulatory requirements"
      ]
    },
    {
      id: "information-sharing",
      title: "Information Sharing",
      content: "We do not sell or rent your personal information to third parties. We may share your information:",
      items: [
        "With your explicit consent",
        "With service providers who assist in app functionality",
        "To comply with legal obligations or court orders",
        "To protect our rights, users' safety, and prevent abuse",
        "In case of business transfer or merger (with prior notice)"
      ]
    },
    {
      id: "data-retention",
      title: "Data Retention",
      content: "We retain your personal data for as long as necessary to provide our services:",
      items: [
        "Account data: Until you delete your account",
        "Usage data: Up to 24 months for analytics purposes",
        "Support communications: Up to 3 years for quality assurance",
        "Legal compliance data: As required by applicable laws"
      ]
    },
    {
      id: "international-transfers",
      title: "International Data Transfers",
      content: "Your data may be transferred to and processed in countries other than your own:",
      items: [
        "We use appropriate safeguards including standard contractual clauses",
        "Data transfers comply with applicable privacy laws (GDPR, CCPA, etc.)",
        "You can request information about specific transfer mechanisms"
      ]
    },
    {
      id: "data-security",
      title: "Data Security",
      content: "We implement appropriate security measures to protect your personal information:",
      items: [
        "Encryption of data in transit and at rest",
        "Regular security assessments and penetration testing",
        "Access controls and multi-factor authentication",
        "Secure data storage with reputable cloud providers",
        "Employee training on data protection practices"
      ]
    },
    {
      id: "your-rights",
      title: "Your Rights",
      content: "Depending on your location, you may have the following rights:",
      items: [
        "Access your personal information",
        "Correct inaccurate or incomplete information",
        "Request deletion of your information",
        "Object to processing of your data",
        "Request data portability",
        "Withdraw consent at any time",
        "Opt-out of marketing communications",
        "Lodge a complaint with supervisory authorities"
      ]
    },
    {
      id: "childrens-privacy",
      title: "Children's Privacy",
      content: "Our app is designed for users aged 13 and older:",
      items: [
        "We do not knowingly collect personal information from children under 13",
        "If we learn we have collected information from a child under 13, we will delete it",
        "Parents/guardians can contact us to review or delete their child's information",
        "Users between 13-18 should have parental guidance when using our services"
      ]
    },
    {
      id: "cookies-tracking",
      title: "Cookies and Tracking",
      content: "We use various technologies to enhance your experience:",
      items: [
        "App preferences and settings storage",
        "Analytics cookies to understand app usage",
        "Authentication tokens to keep you signed in",
        "You can manage tracking preferences in your device settings"
      ]
    },
    {
      id: "california-privacy",
      title: "California Privacy Rights",
      content: "For California residents, additional rights under CCPA/CPRA include:",
      items: [
        "Right to know what personal information is collected and how it's used",
        "Right to delete personal information",
        "Right to opt-out of sale/sharing of personal information",
        "Right to non-discrimination for exercising privacy rights",
        "Contact us at info@beatinbox.com to exercise these rights"
      ]
    },
    {
      id: "contact-us",
      title: "Contact Us",
      content: "If you have any questions about this Privacy Policy, please contact us at:",
      items: [
        "Email: info@beatinbox.com",
        "Response time: Within 30 days for privacy-related requests",
        "Include 'Privacy Request' in your subject line for faster processing"
      ]
    },
    {
      id: "changes-to-policy",
      title: "Changes to This Policy",
      content: "We may update this Privacy Policy from time to time. We will notify you of any material changes by:",
      items: [
        "Posting the new Privacy Policy in the app",
        "Sending an email notification to registered users",
        "Requesting fresh consent where required by law",
        "Updating the 'Last Updated' date above"
      ]
    }
  ]
}; 