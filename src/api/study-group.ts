import api from '@/api/axios';

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
}

export interface GroupMessage {
  id: string;
  content: string;
  authorId: string;
  groupId: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  topic: string | null;
  isPrivate: boolean;
  joinCode: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
  _count: {
    members: number;
  };
  members?: GroupMember[];
  isMember?: boolean;
  myRole?: 'ADMIN' | 'MEMBER';
}

export interface GetGroupsOptions {
  search?: string;
  topic?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedGroups {
  groups: StudyGroup[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const studyGroupApi = {
  getPublicGroups: async (options: GetGroupsOptions): Promise<PaginatedGroups> => {
    const { data } = await api.get('/study-groups', { params: options });
    return data.data;
  },

  getMyGroups: async (): Promise<StudyGroup[]> => {
    const { data } = await api.get('/study-groups/my-groups');
    return data.data;
  },

  getGroupDetails: async (id: string): Promise<StudyGroup> => {
    const { data } = await api.get(`/study-groups/${id}`);
    return data.data;
  },

  createGroup: async (payload: {
    name: string;
    description?: string;
    topic?: string;
    isPrivate?: boolean;
    joinCode?: string;
  }): Promise<StudyGroup> => {
    const { data } = await api.post('/study-groups', payload);
    return data.data;
  },

  joinGroup: async (id: string, joinCode?: string): Promise<GroupMember> => {
    const { data } = await api.post(`/study-groups/${id}/join`, { joinCode });
    return data.data;
  },

  leaveGroup: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await api.post(`/study-groups/${id}/leave`);
    return data.data;
  },

  getMessages: async (id: string, options?: { page?: number; limit?: number }): Promise<GroupMessage[]> => {
    const { data } = await api.get(`/study-groups/${id}/messages`, { params: options });
    return data.data;
  },

  sendMessage: async (id: string, content: string): Promise<GroupMessage> => {
    const { data } = await api.post(`/study-groups/${id}/messages`, { content });
    return data.data;
  },
};
