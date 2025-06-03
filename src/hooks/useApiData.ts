import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiDataOptions {
  cacheKey?: string;
  cacheDuration?: number;
  refetchOnMount?: boolean;
  refetchOnFocus?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

interface UseApiDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
}

export function useApiData<T>(
  apiCall: () => Promise<T>,
  options: UseApiDataOptions = {}
): UseApiDataReturn<T> {
  const {
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    refetchOnMount = true,
    refetchOnFocus = false,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const retryCountRef = useRef(0);
  const lastFetchRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  // Check if data is stale
  const isDataStale = useCallback(() => {
    if (!data || !lastFetchRef.current) return true;
    return Date.now() - lastFetchRef.current > cacheDuration;
  }, [data, cacheDuration]);

  // Fetch data with retry logic
  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isMountedRef.current) return;

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await apiCall();
      
      if (isMountedRef.current) {
        setData(result);
        lastFetchRef.current = Date.now();
        retryCountRef.current = 0;
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      
      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        console.log(`Retrying API call (${retryCountRef.current}/${retryCount})...`);
        
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchData(isRefresh);
          }
        }, retryDelay * retryCountRef.current);
        return;
      }

      setError(errorMessage);
      console.error('API call failed after retries:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [apiCall, retryCount, retryDelay]);

  // Refetch function (respects cache)
  const refetch = useCallback(async () => {
    if (isDataStale()) {
      await fetchData();
    }
  }, [fetchData, isDataStale]);

  // Refresh function (ignores cache)
  const refresh = useCallback(async () => {
    lastFetchRef.current = 0; // Force refresh
    await fetchData(true);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Refetch on focus (optional)
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      if (isDataStale()) {
        fetchData();
      }
    };

    // Note: In a real app, you'd listen to app state changes
    // For now, we'll skip this implementation
    
    return () => {
      // Cleanup focus listener
    };
  }, [refetchOnFocus, fetchData, isDataStale]);

  return {
    data,
    loading,
    error,
    refetch,
    refresh,
    isRefreshing,
  };
}

// Specialized hook for paginated data
export function usePaginatedApiData<T>(
  apiCall: (page: number, limit: number) => Promise<{ items: T[]; total: number; page: number; totalPages: number }>,
  initialLimit = 10
) {
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [allItems, setAllItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const {
    data: paginatedData,
    loading,
    error,
    refetch,
    refresh,
    isRefreshing,
  } = useApiData(
    () => apiCall(page, limit),
    {
      cacheKey: `paginated_${page}_${limit}`,
      refetchOnMount: true,
    }
  );

  // Update items when new data arrives
  useEffect(() => {
    if (paginatedData) {
      if (page === 1) {
        setAllItems(paginatedData.items);
      } else {
        setAllItems(prev => [...prev, ...paginatedData.items]);
      }
      setHasMore(page < paginatedData.totalPages);
    }
  }, [paginatedData, page]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const refreshAll = useCallback(async () => {
    setPage(1);
    setAllItems([]);
    setHasMore(true);
    await refresh();
  }, [refresh]);

  return {
    items: allItems,
    loading,
    error,
    hasMore,
    loadMore,
    refresh: refreshAll,
    isRefreshing,
    totalItems: paginatedData?.total || 0,
    currentPage: page,
    totalPages: paginatedData?.totalPages || 0,
  };
} 