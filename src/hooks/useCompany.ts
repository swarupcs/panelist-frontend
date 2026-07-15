// src/hooks/useCompany.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { companyApi } from '@/api/company.api';
import { useNavigate } from 'react-router-dom';

export function useCompanies(filters?: {
  industry?: string;
  difficulty?: string;
}) {
  return useQuery({
    queryKey: ['companies', filters],
    queryFn: () => companyApi.getAll(filters),
    select: (data) => data.companies,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCompany(slug: string | null) {
  return useQuery({
    queryKey: ['companies', 'detail', slug],
    queryFn: () => companyApi.getBySlug(slug!),
    enabled: !!slug,
    select: (data) => data.company,
  });
}

export function useCompanyQuestions(
  slug: string | null,
  filters?: { difficulty?: string },
) {
  return useQuery({
    queryKey: ['companies', 'questions', slug, filters],
    queryFn: () => companyApi.getQuestions(slug!, filters),
    enabled: !!slug,
    select: (data) => data.questions,
  });
}

export function useCompanyProgress(slug: string | null) {
  return useQuery({
    queryKey: ['companies', 'progress', slug],
    queryFn: () => companyApi.getUserProgress(slug!),
    enabled: !!slug,
    select: (data) => data.progress,
  });
}

export function useRecommendedCompanies() {
  return useQuery({
    queryKey: ['companies', 'recommended'],
    queryFn: companyApi.getRecommended,
    select: (data) => data.companies,
  });
}

export function useStartCompanyPractice() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({
      slug,
      config,
    }: {
      slug: string;
      config: { questionCount: number; difficulty?: string; duration?: number };
    }) => companyApi.startPractice(slug, config),
    onSuccess: (data) => {
      if (data?.session?.id) navigate(`/interview/${data.session.id}`);
    },
  });
}
