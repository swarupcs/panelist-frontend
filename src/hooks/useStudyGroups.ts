import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { GetGroupsOptions, PaginatedGroups, StudyGroup, GroupMessage } from '@/api/study-group';
import { studyGroupApi } from '@/api/study-group';

export const studyGroupKeys = {
  all: ['study-groups'] as const,
  public: (options: GetGroupsOptions) => [...studyGroupKeys.all, 'public', options] as const,
  mine: () => [...studyGroupKeys.all, 'mine'] as const,
  detail: (id: string) => [...studyGroupKeys.all, 'detail', id] as const,
  messages: (id: string) => [...studyGroupKeys.all, 'messages', id] as const,
};

export function usePublicGroups(options: GetGroupsOptions) {
  return useQuery<PaginatedGroups>({
    queryKey: studyGroupKeys.public(options),
    queryFn: () => studyGroupApi.getPublicGroups(options),
  });
}

export function useMyGroups() {
  return useQuery<StudyGroup[]>({
    queryKey: studyGroupKeys.mine(),
    queryFn: studyGroupApi.getMyGroups,
  });
}

export function useGroupDetails(id: string) {
  return useQuery<StudyGroup>({
    queryKey: studyGroupKeys.detail(id),
    queryFn: () => studyGroupApi.getGroupDetails(id),
    enabled: !!id,
    retry: false, // Don't retry if 403 (private) or 404
  });
}

export function useGroupMessages(id: string) {
  return useQuery<GroupMessage[]>({
    queryKey: studyGroupKeys.messages(id),
    queryFn: () => studyGroupApi.getMessages(id),
    enabled: !!id,
    refetchInterval: 3000, // Simple MVP polling for real-time chat effect
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studyGroupApi.createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studyGroupKeys.all });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, joinCode }: { id: string; joinCode?: string }) => studyGroupApi.joinGroup(id, joinCode),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: studyGroupKeys.mine() });
      queryClient.invalidateQueries({ queryKey: studyGroupKeys.detail(variables.id) });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studyGroupApi.leaveGroup,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: studyGroupKeys.mine() });
      queryClient.invalidateQueries({ queryKey: studyGroupKeys.detail(id) });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => studyGroupApi.sendMessage(id, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: studyGroupKeys.messages(variables.id) });
    },
  });
}
