import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { GetPostsOptions, GetPostsResponse, ForumPost } from '@/api/forum';
import { forumApi } from '@/api/forum';

export const forumKeys = {
  all: ['forum'] as const,
  posts: (options: GetPostsOptions) => [...forumKeys.all, 'posts', options] as const,
  post: (id: string) => [...forumKeys.all, 'post', id] as const,
};

export function usePosts(options: GetPostsOptions) {
  return useQuery<GetPostsResponse>({
    queryKey: forumKeys.posts(options),
    queryFn: () => forumApi.getPosts(options),
  });
}

export function usePost(id: string) {
  return useQuery<ForumPost>({
    queryKey: forumKeys.post(id),
    queryFn: () => forumApi.getPostById(id),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: forumApi.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forumKeys.all });
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: forumApi.createComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.post(variables.postId) });
    },
  });
}

export function useVotePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, value }: { postId: string; value: 1 | -1 }) => forumApi.votePost(postId, value),
    onSuccess: (_, variables) => {
      // Invalidate both the list and the specific post to refresh vote counts
      queryClient.invalidateQueries({ queryKey: forumKeys.post(variables.postId) });
      queryClient.invalidateQueries({ queryKey: [...forumKeys.all, 'posts'] });
    },
  });
}

export function useVoteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, commentId, value }: { postId: string; commentId: string; value: 1 | -1 }) => forumApi.voteComment(commentId, value),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.post(variables.postId) });
    },
  });
}

export function useAcceptAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) => forumApi.acceptAnswer(postId, commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.post(variables.postId) });
      queryClient.invalidateQueries({ queryKey: [...forumKeys.all, 'posts'] });
    },
  });
}
