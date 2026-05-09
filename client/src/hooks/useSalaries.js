import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useSalaries(initialFilters = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    let isMounted = true;
    const fetchSalaries = async () => {
      setLoading(true);
      try {
        const response = await api.getSalaries(filters);
        if (isMounted) {
          setData(response);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to fetch salaries');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSalaries();
    return () => { isMounted = false; };
  }, [filters]);

  return { data, loading, error, filters, setFilters };
}
