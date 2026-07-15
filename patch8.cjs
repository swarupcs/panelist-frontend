const fs = require('fs');
const path = require('path');

// 1. Update user.api.ts
const apiPath = path.join(__dirname, 'src/api/user.api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

const apiAddition = `
  updateTargetDate: async (pathId: string, targetDate: string | null): Promise<LearningPathResponse> => {
    const response = await api.patch(\`/learning-path/\${pathId}/target-date\`, { targetDate });
    return response.data;
  },
`;

if (!apiContent.includes('updateTargetDate')) {
  // Add before `generateCrashCourse` or at end of learningPath object
  const insertIndex = apiContent.indexOf('generateCrashCourse:');
  if (insertIndex !== -1) {
    apiContent = apiContent.substring(0, insertIndex) + apiAddition + '\n  ' + apiContent.substring(insertIndex);
  }
  fs.writeFileSync(apiPath, apiContent, 'utf8');
}

// 2. Update useLearning.ts
const hooksPath = path.join(__dirname, 'src/hooks/useLearning.ts');
let hooksContent = fs.readFileSync(hooksPath, 'utf8');

const hookAddition = `
export const useUpdateTargetDate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pathId, targetDate }: { pathId: string; targetDate: string | null }) =>
      userApi.learningPath.updateTargetDate(pathId, targetDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-path', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['learning-path', 'all'] });
      toast.success('Target date updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update target date');
    },
  });
};
`;

if (!hooksContent.includes('useUpdateTargetDate')) {
  hooksContent += hookAddition;
  fs.writeFileSync(hooksPath, hooksContent, 'utf8');
}

console.log('Frontend APIs patched successfully!');
