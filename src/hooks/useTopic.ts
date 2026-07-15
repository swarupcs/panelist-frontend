// src/hooks/useTopic.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { topicApi } from '@/api/topic.api';
import { useNavigate } from 'react-router-dom';

export function useTopics(filters?: {
  category?: string;
  difficulty?: string;
}) {
  return useQuery({
    queryKey: ['topics', filters],
    queryFn: () => topicApi.getAll(filters),
    select: (data) => data.topics,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTopic(slug: string | null) {
  return useQuery({
    queryKey: ['topics', 'detail', slug],
    queryFn: () => topicApi.getBySlug(slug!),
    enabled: !!slug,
    select: (data) => data.topic,
  });
}

export function useTopicTree(category?: string) {
  return useQuery({
    queryKey: ['topics', 'tree', category],
    queryFn: () => topicApi.getTree(category),
    select: (data) => data.tree,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTopicQuestions(
  slug: string | null,
  filters?: { difficulty?: string },
) {
  return useQuery({
    queryKey: ['topics', 'questions', slug, filters],
    queryFn: () => topicApi.getQuestions(slug!, filters),
    enabled: !!slug,
    select: (data) => data.questions,
  });
}

export function useMasteryOverview() {
  return useQuery({
    queryKey: ['topics', 'mastery'],
    queryFn: topicApi.getMasteryOverview,
    staleTime: 1000 * 60 * 2,
  });
}

export function useRecommendedTopics() {
  return useQuery({
    queryKey: ['topics', 'recommended'],
    queryFn: topicApi.getRecommended,
    select: (data) => data.topics,
  });
}

export function useStartTopicPractice() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({
      slug,
      config,
    }: {
      slug: string;
      config: { questionCount: number; difficulty?: string; duration?: number };
    }) => topicApi.startPractice(slug, config),
    onSuccess: (data) => {
      if (data?.session?.id) navigate(`/interview/${data.session.id}`);
    },
  });
}
