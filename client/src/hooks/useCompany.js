import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useCompany(id) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;
    
    const fetchCompany = async () => {
      setLoading(true);
      try {
        const response = await api.getCompany(id);
        if (isMounted) {
          setCompany(response);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to fetch company details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCompany();
    return () => { isMounted = false; };
  }, [id]);

  return { company, loading, error };
}
