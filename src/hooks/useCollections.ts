import { useQuery } from '@tanstack/react-query';
import { getStoriesCollection } from '../services/api';

const STALE_TIME_MS = 5 * 60 * 1000;
const GC_TIME_MS = 10 * 60 * 1000;

export function useCollections(slug: string) {
  const query = useQuery({
    queryKey: ['stories-collection', slug],
    queryFn: () => getStoriesCollection(slug),
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
  });

  return {
    data: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
