import { useState, useEffect } from 'react';
import { PrivacyPolicyData } from '@/data/privacyPolicy';

export const usePrivacyPolicy = () => {
  const [data, setData] = useState<PrivacyPolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/privacy-policy');
        if (!response.ok) {
          throw new Error('Failed to fetch privacy policy');
        }
        const privacyData: PrivacyPolicyData = await response.json();
        setData(privacyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyPolicy();
  }, []);

  return { data, loading, error };
}; 