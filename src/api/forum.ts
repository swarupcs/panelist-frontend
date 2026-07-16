import api from '@/api/axios';

export const ForumCategories = {
  GENERAL: 'GENERAL',
  DSA: 'DSA',
  SYSTEM_DESIGN: 'SYSTEM_DESIGN',
  BEHAVIORAL: 'BEHAVIORAL',
  INTERVIEW_EXPERIENCE: 'INTERVIEW_EXPERIENCE',
  CAREER_ADVICE: 'CAREER_ADVICE',
} as const;

export type ForumCategory = typeof ForumCategories[keyof typeof ForumCategories];

export interface ForumAuthor {
  id: string;
  name: string;
  profilePicture: string | null;
  role: string;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  category: ForumCategory;
  tags: string[];
  upvotes: number;
  downvotes: number;
  viewCount: number;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor;
  commentCount?: number;
  comments?: ForumComment[];
  userVote?: number; // 1 (up), -1 (down), 0 (none)
}

export interface ForumComment {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  parentCommentId: string | null;
  upvotes: number;
  downvotes: number;
  isAcceptedAnswer: boolean;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor;
  replies?: ForumComment[];
  userVote?: number;
}

export interface GetPostsOptions {
  page?: number;
  limit?: number;
  category?: ForumCategory;
  sortBy?: 'newest' | 'top' | 'unanswered';
  search?: string;
}

export interface GetPostsResponse {
  posts: ForumPost[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const forumApi = {
  getPosts: async (options: GetPostsOptions): Promise<GetPostsResponse> => {
    const { data } = await api.get('/forum/posts', { params: options });
    return data;
  },

  getPostById: async (id: string): Promise<ForumPost> => {
    const { data } = await api.get(`/forum/posts/${id}`);
    return data;
  },

  createPost: async (payload: { title: string; content: string; category: string; tags: string[] }): Promise<ForumPost> => {
    const { data } = await api.post('/forum/posts', payload);
    return data;
  },

  createComment: async (payload: { postId: string; content: string; parentCommentId?: string }): Promise<ForumComment> => {
    const { data } = await api.post(`/forum/posts/${payload.postId}/comments`, {
      content: payload.content,
      parentCommentId: payload.parentCommentId,
    });
    return data;
  },

  votePost: async (postId: string, value: 1 | -1): Promise<{ userVote: number }> => {
    const { data } = await api.post(`/forum/posts/${postId}/vote`, { value });
    return data;
  },

  voteComment: async (commentId: string, value: 1 | -1): Promise<{ userVote: number }> => {
    const { data } = await api.post(`/forum/comments/${commentId}/vote`, { value });
    return data;
  },

  acceptAnswer: async (postId: string, commentId: string): Promise<ForumComment> => {
    const { data } = await api.patch(`/forum/posts/${postId}/comments/${commentId}/accept`);
    return data;
  },
};
