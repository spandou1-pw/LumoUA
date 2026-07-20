import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export interface Post {
  id: string;
  authorId: string;
  body: string | null;
  visibility: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
  viewerHasBookmarked: boolean;
}

interface FeedPage {
  items: Post[];
  nextCursor: string | null;
}

/** doc 27: Following feed, cursor-paginated, cached for pull-to-refresh + infinite scroll. */
export function useFeed(type: 'following' | 'global' = 'following') {
  return useInfiniteQuery({
    queryKey: ['feed', type],
    queryFn: ({ pageParam }) =>
      api.get<FeedPage>(`/feed/${type}${pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ''}`),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000, // doc 27: matches the backend's own 30s feed cache TTL
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api.post(`/posts/${postId}/like`),
    // doc 05 NFR-PERF-4: optimistic update — the like reflects instantly,
    // reconciled against the server response in the background.
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previous = queryClient.getQueriesData<{ pages: FeedPage[] }>({ queryKey: ['feed'] });
      previous.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData(key, {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((post) =>
              post.id === postId
                ? { ...post, viewerHasLiked: true, likeCount: post.likeCount + 1 }
                : post,
            ),
          })),
        });
      });
      return { previous };
    },
    onError: (_err, _postId, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string }) => api.post<Post>('/posts', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
}
