import { useState, useEffect } from 'react';
import { TermsOfServiceData } from '@/data/termsOfService';

export const useTermsOfService = () => {
  const [data, setData] = useState<TermsOfServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTermsOfService = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/terms-of-service');
        if (!response.ok) {
          throw new Error('Failed to fetch terms of service');
        }
        const termsData: TermsOfServiceData = await response.json();
        setData(termsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTermsOfService();
  }, []);

  return { data, loading, error };
}; 