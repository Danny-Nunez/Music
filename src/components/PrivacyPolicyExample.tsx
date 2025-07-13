import { usePrivacyPolicy } from '@/hooks/usePrivacyPolicy';
import { privacyPolicyData } from '@/data/privacyPolicy';

export default function PrivacyPolicyExample() {
  // Method 1: Direct import (fastest, for static usage)
  const staticData = privacyPolicyData;
  
  // Method 2: API hook (for dynamic usage)
  const { data: apiData, loading, error } = usePrivacyPolicy();

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Privacy Policy Data Access Methods</h2>
      
      {/* Method 1: Direct Import */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Method 1: Direct Import</h3>
        <p className="text-gray-600 mb-2">Static data, fastest access:</p>
        <div className="bg-gray-100 p-3 rounded">
          <p><strong>Title:</strong> {staticData.title}</p>
          <p><strong>Sections:</strong> {staticData.sections.length}</p>
          <p><strong>Last Updated:</strong> {staticData.lastUpdated}</p>
        </div>
      </div>

      {/* Method 2: API Hook */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Method 2: API Hook</h3>
        <p className="text-gray-600 mb-2">Dynamic data, can be refreshed:</p>
        <div className="bg-gray-100 p-3 rounded">
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {apiData && (
            <>
              <p><strong>Title:</strong> {apiData.title}</p>
              <p><strong>Sections:</strong> {apiData.sections.length}</p>
              <p><strong>Last Updated:</strong> {apiData.lastUpdated}</p>
            </>
          )}
        </div>
      </div>

      {/* Method 3: Direct API Call */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Method 3: Direct API Call</h3>
        <p className="text-gray-600 mb-2">Manual fetch, full control:</p>
        <button 
          onClick={async () => {
            try {
              const response = await fetch('/api/privacy-policy');
              const data = await response.json();
              console.log('API Response:', data);
              alert(`Fetched ${data.sections.length} sections`);
            } catch (error) {
              console.error('API Error:', error);
            }
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Fetch via API
        </button>
      </div>

      {/* Example: Display a specific section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Example: Display Specific Section</h3>
        <div className="bg-gray-100 p-3 rounded">
          {staticData.sections.find(s => s.id === 'contact-us') && (
            <div>
              <h4 className="font-semibold">
                {staticData.sections.find(s => s.id === 'contact-us')?.title}
              </h4>
              <p>{staticData.sections.find(s => s.id === 'contact-us')?.content}</p>
              <ul className="list-disc pl-4 mt-2">
                {staticData.sections.find(s => s.id === 'contact-us')?.items?.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 