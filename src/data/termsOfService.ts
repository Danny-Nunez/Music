export interface TermsOfServiceSection {
  id: string;
  title: string;
  content: string;
  items?: string[];
}

export interface TermsOfServiceData {
  title: string;
  lastUpdated: string;
  sections: TermsOfServiceSection[];
}

export const termsOfServiceData: TermsOfServiceData = {
  title: "Terms and Conditions",
  lastUpdated: "January 5, 2025",
  sections: [
    {
      id: "acceptance-of-terms",
      title: "Acceptance of Terms",
      content: "By downloading, installing, accessing, or using the BeatinBox mobile application (the \"App\") and its related services, you accept and agree to be bound by these Terms and Conditions (\"Terms\"). These Terms constitute a legal agreement between you and BeatinBox. If you do not agree to these Terms, you must not download, install, access, or use the App."
    },
    {
      id: "app-store-compliance",
      title: "App Store and Platform Compliance", 
      content: "This App is distributed through the Apple App Store and is subject to Apple's standard End User License Agreement (EULA) and App Store Review Guidelines. In the event of any conflict between these Terms and Apple's EULA, Apple's EULA shall take precedence. You acknowledge that:",
      items: [
        "These Terms are between you and BeatinBox only, not with Apple",
        "Apple is not responsible for the App or its content",
        "You will only use the App on Apple-branded products that you own or control",
        "You acknowledge Apple's right to enforce these Terms as a third-party beneficiary"
      ]
    },
    {
      id: "eligibility-and-account",
      title: "Eligibility and User Account",
      content: "You must be at least 13 years of age to use this App. If you are under 18, you must have your parent or guardian's permission to use the App. When creating an account, you agree to:",
      items: [
        "Provide accurate, current, and complete information",
        "Maintain the security and confidentiality of your account credentials",
        "Accept responsibility for all activities under your account",
        "Notify us immediately of any unauthorized use of your account",
        "Use only one account per person unless explicitly permitted"
      ]
    },
    {
      id: "app-license-and-usage",
      title: "App License and Permitted Usage",
      content: "Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to use the App for personal, non-commercial purposes. You may:",
      items: [
        "Stream music content through the App for personal enjoyment",
        "Create and manage personal playlists",
        "Share content through approved social features within the App",
        "Use the App on devices linked to your account as permitted by the platform"
      ]
    },
    {
      id: "prohibited-activities",
      title: "Prohibited Activities and Content Restrictions",
      content: "You agree not to use the App to:",
      items: [
        "Violate any applicable laws, regulations, or third-party rights",
        "Upload, post, or transmit any harmful, illegal, or inappropriate content",
        "Attempt to gain unauthorized access to our systems or other users' accounts",
        "Reverse engineer, decompile, or attempt to extract source code from the App",
        "Use automated tools, bots, or scripts to access or interact with the App",
        "Circumvent any content protection or digital rights management systems",
        "Download or attempt to download copyrighted content without proper authorization",
        "Engage in any activity that could harm, disable, or impair the App's functionality",
        "Violate any content licensing agreements or copyright laws",
        "Use the App for any commercial purpose without express written permission"
      ]
    },
    {
      id: "content-and-intellectual-property",
      title: "Content and Intellectual Property Rights",
      content: "All music, audio, video, images, text, and other content available through the App is protected by copyright and other intellectual property laws. You acknowledge that:",
      items: [
        "All content is owned by BeatinBox, its licensors, or content providers",
        "You receive only a limited streaming license, not ownership of any content",
        "You may not copy, download, distribute, or create derivative works from our content",
        "Any user-generated content you submit must not infringe third-party rights",
        "We reserve the right to remove any content that violates these Terms",
        "Content availability may vary by region and may change without notice"
      ]
    },
    {
      id: "privacy-and-data-protection",
      title: "Privacy and Data Protection",
      content: "Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the App, you consent to:",
      items: [
        "The collection and processing of your data as described in our Privacy Policy",
        "The use of cookies and similar technologies to improve your experience",
        "Analytics and usage data collection to enhance App functionality",
        "Communications from us regarding your account and App updates"
      ]
    },
    {
      id: "subscriptions-and-payments",
      title: "Subscriptions and In-App Purchases",
      content: "If you purchase any subscription or make in-app purchases, the following terms apply:",
      items: [
        "All purchases are processed through the App Store and subject to Apple's payment terms",
        "Subscriptions automatically renew unless cancelled before the renewal date",
        "You can manage your subscription through your App Store account settings",
        "Refunds are handled according to Apple's refund policy",
        "Prices may change with appropriate notice as required by applicable law",
        "Access to premium features requires an active subscription"
      ]
    },
    {
      id: "service-availability-and-modifications",
      title: "Service Availability and Modifications",
      content: "We reserve the right to:",
      items: [
        "Modify, suspend, or discontinue the App or any features with or without notice",
        "Update these Terms at any time, with changes taking effect upon posting",
        "Remove or restrict access to content or features due to licensing or legal requirements",
        "Perform maintenance that may temporarily limit App functionality",
        "Implement security measures that may affect App performance"
      ]
    },
    {
      id: "user-content-and-community",
      title: "User-Generated Content and Community Guidelines",
      content: "If you submit, post, or share any content through the App, you represent and warrant that:",
      items: [
        "You own or have the necessary rights to share such content",
        "Your content does not violate any third-party rights or applicable laws",
        "You grant us a license to use, display, and distribute your content within the App",
        "You will not share content that is harmful, offensive, or inappropriate",
        "You understand that we may remove content that violates these guidelines"
      ]
    },
    {
      id: "third-party-services",
      title: "Third-Party Services and Links",
      content: "The App may integrate with or link to third-party services, websites, or content. You acknowledge that:",
      items: [
        "We are not responsible for third-party services or their content",
        "Third-party services are governed by their own terms and policies",
        "You interact with third-party services at your own risk",
        "We do not endorse or control third-party content or services"
      ]
    },
    {
      id: "limitation-of-liability",
      title: "Limitation of Liability and Disclaimers",
      content: "TO THE MAXIMUM EXTENT PERMITTED BY LAW:",
      items: [
        "THE APP IS PROVIDED \"AS IS\" WITHOUT WARRANTIES OF ANY KIND",
        "WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE",
        "WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES",
        "OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE APP IN THE PAST 12 MONTHS",
        "WE ARE NOT LIABLE FOR SERVICE INTERRUPTIONS, DATA LOSS, OR DEVICE DAMAGE",
        "SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS, SO THESE MAY NOT APPLY TO YOU"
      ]
    },
    {
      id: "indemnification",
      title: "Indemnification",
      content: "You agree to indemnify, defend, and hold harmless BeatinBox, its affiliates, officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from:",
      items: [
        "Your use of the App in violation of these Terms",
        "Your content or any content you submit through the App",
        "Your violation of any third-party rights",
        "Your breach of any applicable laws or regulations"
      ]
    },
    {
      id: "termination",
      title: "Account Termination and Suspension",
      content: "We may terminate or suspend your account and access to the App at any time for:",
      items: [
        "Violation of these Terms or our community guidelines",
        "Fraudulent, abusive, or illegal activity",
        "Extended periods of inactivity",
        "Technical or security reasons",
        "Upon your request to delete your account"
      ]
    },
    {
      id: "export-control-and-legal-compliance",
      title: "Export Control and Legal Compliance",
      content: "You acknowledge that the App may be subject to export control laws and regulations. You agree to:",
      items: [
        "Comply with all applicable export control and sanctions laws",
        "Not use the App in any jurisdiction where it is prohibited",
        "Not export or re-export the App to prohibited countries or individuals",
        "Comply with all local laws and regulations in your jurisdiction"
      ]
    },
    {
      id: "dispute-resolution",
      title: "Dispute Resolution and Governing Law",
      content: "These Terms are governed by the laws of [Your Jurisdiction]. For any disputes:",
      items: [
        "You agree to first attempt to resolve disputes through direct communication with us",
        "If direct resolution fails, disputes will be resolved through binding arbitration",
        "Class action lawsuits and jury trials are waived to the extent permitted by law",
        "Some jurisdictions may not allow certain waivers, so these may not apply to you"
      ]
    },
    {
      id: "accessibility-and-platform-features",
      title: "Accessibility and Platform Features",
      content: "We are committed to making our App accessible to users with disabilities and compatible with platform accessibility features:",
      items: [
        "The App supports standard platform accessibility features",
        "We strive to comply with applicable accessibility guidelines",
        "Contact us if you encounter accessibility barriers",
        "Platform-specific features may vary between device types"
      ]
    },
    {
      id: "data-retention-and-deletion",
      title: "Data Retention and Account Deletion",
      content: "Regarding your data and account:",
      items: [
        "We retain your data only as long as necessary to provide services",
        "You can request account deletion through the App settings or by contacting us",
        "Some data may be retained for legal or safety reasons after account deletion",
        "Backup copies may persist for a reasonable time after deletion",
        "Downloaded content will be removed upon account termination"
      ]
    },
    {
      id: "updates-and-notifications",
      title: "App Updates and Notifications",
      content: "To maintain security and functionality:",
      items: [
        "We may require you to update the App to continue using it",
        "Automatic updates may be enabled through your device settings",
        "We may send you notifications about important changes or security issues",
        "You can manage notification preferences in the App settings"
      ]
    },
    {
      id: "contact-information",
      title: "Contact Information and Support",
      content: "For any questions, concerns, or support needs regarding these Terms or the App, please contact us at:",
      items: [
        "Email: info@beatinbox.com",
        "Support website: [Your support website]",
        "We will respond to legitimate inquiries within a reasonable timeframe"
      ]
    },
    {
      id: "severability-and-entire-agreement",
      title: "Severability and Entire Agreement",
      content: "These Terms, together with our Privacy Policy, constitute the entire agreement between you and BeatinBox regarding the App. If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect. Our failure to enforce any provision does not waive our right to enforce it later."
    }
  ]
}; 