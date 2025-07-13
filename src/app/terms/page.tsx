'use client';

import { termsOfServiceData } from '@/data/termsOfService';

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-white">{termsOfServiceData.title}</h1>
      
      <div className="space-y-6 text-gray-300">
        {termsOfServiceData.sections.map((section, index) => (
          <section key={section.id}>
            <h2 className="text-2xl font-semibold mb-4 text-white">
              {index + 1}. {section.title}
            </h2>
            <p>{section.content}</p>
            {section.items && (
              <ul className="list-disc pl-6 mt-2 space-y-2">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        
        <section>
          <p className="mt-4 text-sm text-gray-400">
            Last Updated: {termsOfServiceData.lastUpdated}
          </p>
        </section>
      </div>
    </div>
  );
}