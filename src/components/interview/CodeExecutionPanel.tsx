// src/components/interview/CodeExecutionPanel.tsx
//
// DSA code editor with language switcher, test-case runner (POST /api/code/execute),
// and a "Submit Code" button that calls the parent's onSubmit callback.

import { useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Terminal,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useExecuteCode } from '@/hooks/useInterviewExtended';
import type {
  ProgrammingLanguage,
  TestCase,
  TestCaseResult,
} from '@/types/interview-extended';

// ── Language definitions ───────────────────────────────────────────────────

const LANGUAGES: {
  value: ProgrammingLanguage;
  label: string;
  placeholder: string;
}[] = [
  {
    value: 'JAVASCRIPT',
    label: 'JavaScript',
    placeholder: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function solution(nums, target) {
  // your code here
}`,
  },
  {
    value: 'PYTHON',
    label: 'Python',
    placeholder: `class Solution:
    def solution(self, nums, target):
        # your code here
        pass`,
  },
  {
    value: 'TYPESCRIPT',
    label: 'TypeScript',
    placeholder: `function solution(nums: number[], target: number): number[] {
  // your code here
}`,
  },
  {
    value: 'JAVA',
    label: 'Java',
    placeholder: `class Solution {
    public int[] solution(int[] nums, int target) {
        // your code here
    }
}`,
  },
  {
    value: 'CPP',
    label: 'C++',
    placeholder: `class Solution {
public:
    vector<int> solution(vector<int>& nums, int target) {
        // your code here
    }
};`,
  },
];

const DEFAULT_TEST_CASES: TestCase[] = [
  { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
  { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] },
  { input: { nums: [3, 3], target: 6 }, expectedOutput: [0, 1] },
];

// ── Test case result row ───────────────────────────────────────────────────

function TestCaseRow({
  result,
  index,
}: {
  result: TestCaseResult;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        'rounded-lg border text-xs',
        result.passed
          ? 'border-green-500/20 bg-green-500/5'
          : 'border-red-500/20 bg-red-500/5',
      )}
    >
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        className='flex w-full items-center justify-between px-3 py-2'
      >
        <div className='flex items-center gap-2'>
          {result.passed ? (
            <CheckCircle2 className='size-3.5 text-green-400 shrink-0' />
          ) : (
            <XCircle className='size-3.5 text-red-400 shrink-0' />
          )}
          <span
            className={cn(
              'font-medium',
              result.passed ? 'text-green-400' : 'text-red-400',
            )}
          >
            Test {index + 1}
          </span>
          {result.executionTime != null && (
            <span className='text-muted-foreground'>
              {result.executionTime}ms
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'size-3.5 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className='border-t border-border/50 px-3 py-2 space-y-1.5'>
          <div>
            <span className='text-muted-foreground'>Input: </span>
            <code className='text-foreground'>
              {JSON.stringify(result.input)}
            </code>
          </div>
          <div>
            <span className='text-muted-foreground'>Expected: </span>
            <code className='text-green-400'>
              {JSON.stringify(result.expectedOutput)}
            </code>
          </div>
          {!result.passed && (
            <div>
              <span className='text-muted-foreground'>Got: </span>
              <code className='text-red-400'>
                {result.actualOutput != null
                  ? JSON.stringify(result.actualOutput)
                  : 'No output'}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface CodeExecutionPanelProps {
  onSubmit: (code: string) => void;
  testCases?: TestCase[];
  submitLoading?: boolean;
  disabled?: boolean;
}

export function CodeExecutionPanel({
  onSubmit,
  testCases,
  submitLoading = false,
  disabled = false,
}: CodeExecutionPanelProps) {
  const [language, setLanguage] = useState<ProgrammingLanguage>('JAVASCRIPT');
  const [code, setCode] = useState('');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const executeCode = useExecuteCode();
  const activeLang = LANGUAGES.find((l) => l.value === language)!;
  const cases =
    testCases && testCases.length > 0 ? testCases : DEFAULT_TEST_CASES;

  const handleRun = () => {
    if (!code.trim() || executeCode.isPending || disabled) return;
    executeCode.mutate({ code, language, testCases: cases });
  };

  const handleSubmit = () => {
    if (!code.trim() || submitLoading || disabled) return;
    onSubmit(code);
  };

  const result = executeCode.data;

  return (
    <div className='space-y-3'>
      {/* Toolbar */}
      <div className='flex items-center justify-between gap-2'>
        {/* Language picker */}
        <div className='relative'>
          <button
            type='button'
            onClick={() => setShowLangMenu((o) => !o)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1.5 rounded-md border border-border bg-secondary',
              'px-3 py-1.5 text-xs font-medium text-foreground transition-colors',
              'hover:bg-secondary/70 disabled:opacity-50',
            )}
          >
            <Terminal className='size-3.5 text-primary' />
            {activeLang.label}
            <ChevronDown className='size-3 text-muted-foreground' />
          </button>

          {showLangMenu && (
            <div className='absolute left-0 top-full z-10 mt-1 min-w-[130px] rounded-lg border border-border bg-popover shadow-lg'>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  type='button'
                  onClick={() => {
                    setLanguage(lang.value);
                    setShowLangMenu(false);
                  }}
                  className={cn(
                    'flex w-full items-center px-3 py-2 text-xs text-left',
                    'hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg',
                    language === lang.value && 'text-primary font-medium',
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Run + Submit */}
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={handleRun}
            disabled={!code.trim() || executeCode.isPending || disabled}
            className={cn(
              'flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5',
              'text-xs font-medium text-muted-foreground transition-colors',
              'hover:bg-secondary hover:text-foreground disabled:opacity-50',
            )}
          >
            {executeCode.isPending ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : (
              <Play className='size-3.5' />
            )}
            {executeCode.isPending ? 'Running…' : 'Run Tests'}
          </button>

          <button
            type='button'
            onClick={handleSubmit}
            disabled={!code.trim() || submitLoading || disabled}
            className={cn(
              'flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5',
              'text-xs font-medium text-primary-foreground transition-colors',
              'hover:bg-primary/90 disabled:opacity-50',
            )}
          >
            {submitLoading ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : (
              <CheckCircle2 className='size-3.5' />
            )}
            Submit Code
          </button>
        </div>
      </div>

      {/* Code textarea */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={activeLang.placeholder}
        disabled={disabled}
        spellCheck={false}
        className={cn(
          'w-full min-h-[240px] resize-y rounded-lg border border-border',
          'bg-card p-4 font-mono text-sm text-foreground',
          'placeholder:text-muted-foreground/40 focus:outline-none',
          'focus:ring-1 focus:ring-primary/50 disabled:opacity-50',
        )}
      />

      {/* Execution error */}
      {executeCode.isError && (
        <div className='flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive'>
          <AlertCircle className='size-3.5 shrink-0' />
          {(executeCode.error as any)?.response?.data?.error?.message ??
            'Code execution failed'}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className='space-y-2'>
          {/* Summary */}
          <div
            className={cn(
              'flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium',
              result.success
                ? 'border-green-500/20 bg-green-500/5 text-green-400'
                : 'border-red-500/20 bg-red-500/5 text-red-400',
            )}
          >
            <div className='flex items-center gap-2'>
              {result.success ? (
                <CheckCircle2 className='size-3.5' />
              ) : (
                <XCircle className='size-3.5' />
              )}
              {result.testCasesPassed}/{result.testCasesTotal} test cases passed
            </div>
            {result.success && (
              <span className='text-muted-foreground'>All tests passed ✓</span>
            )}
          </div>

          {/* Per-test breakdown */}
          {result.testCaseResults.length > 0 && (
            <div className='space-y-1.5'>
              {result.testCaseResults.map((tcr, i) => (
                <TestCaseRow key={i} result={tcr} index={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
