import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
      toast.success('Post created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create post');
    }
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: forumApi.createComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.post(variables.postId) });
      toast.success('Comment posted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to post comment');
    }
  });
}

export function useVotePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, value }: { postId: string; value: 1 | -1 }) => forumApi.votePost(postId, value),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.post(variables.postId) });
      queryClient.invalidateQueries({ queryKey: [...forumKeys.all, 'posts'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to vote');
    }
  });
}

export function useVoteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, commentId, value }: { postId: string; commentId: string; value: 1 | -1 }) => forumApi.voteComment(commentId, value),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.post(variables.postId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to vote');
    }
  });
}

export function useAcceptAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) => forumApi.acceptAnswer(postId, commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.post(variables.postId) });
      queryClient.invalidateQueries({ queryKey: [...forumKeys.all, 'posts'] });
      toast.success('Answer accepted!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to accept answer');
    }
  });
}
