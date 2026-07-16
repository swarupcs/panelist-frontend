// src/components/interview/CodeExecutionPanel.tsx
//
// DSA code editor with Monaco Editor, language switcher, test-case runner,
// and a "Submit Code" button that calls the parent's onSubmit callback.

import { useState, useRef, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Terminal,
  Loader2,
  AlertCircle,
  Clock,
  Cpu
} from 'lucide-react';
import Editor, { useMonaco } from '@monaco-editor/react';
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
  monacoLang: string;
  placeholder: string;
}[] = [
  {
    value: 'JAVASCRIPT',
    label: 'JavaScript',
    monacoLang: 'javascript',
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
    monacoLang: 'python',
    placeholder: `class Solution:
    def solution(self, nums, target):
        # your code here
        pass`,
  },
  {
    value: 'TYPESCRIPT',
    label: 'TypeScript',
    monacoLang: 'typescript',
    placeholder: `function solution(nums: number[], target: number): number[] {
  // your code here
}`,
  },
  {
    value: 'JAVA',
    label: 'Java',
    monacoLang: 'java',
    placeholder: `class Solution {
    public int[] solution(int[] nums, int target) {
        // your code here
    }
}`,
  },
  {
    value: 'CPP',
    label: 'C++',
    monacoLang: 'cpp',
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
        'rounded-lg border text-xs overflow-hidden',
        result.passed
          ? 'border-green-500/20 bg-green-500/5'
          : 'border-red-500/20 bg-red-500/5',
      )}
    >
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        className='flex w-full items-center justify-between px-3 py-2 hover:bg-black/5 transition-colors'
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
          <div className="flex items-center gap-2 ml-2">
            {result.executionTime != null && (
              <span className='flex items-center gap-1 text-muted-foreground'>
                <Clock className="size-3" />
                {result.executionTime}ms
              </span>
            )}
            {result.memory != null && (
              <span className='flex items-center gap-1 text-muted-foreground'>
                <Cpu className="size-3" />
                {result.memory} KB
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'size-3.5 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className='border-t border-border/50 px-3 py-2 space-y-1.5 bg-black/10'>
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
              <code className='text-red-400 whitespace-pre-wrap font-mono text-[11px] block mt-1 p-2 rounded bg-red-950/30 border border-red-500/20'>
                {result.actualOutput || result.error || 'No output'}
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
  const [codeMap, setCodeMap] = useState<Partial<Record<ProgrammingLanguage, string>>>({});
  const [showLangMenu, setShowLangMenu] = useState(false);
  const monaco = useMonaco();
  
  const executeCode = useExecuteCode();
  const activeLang = LANGUAGES.find((l) => l.value === language)!;
  const cases = testCases && testCases.length > 0 ? testCases : DEFAULT_TEST_CASES;

  // Initialize code for current language if empty
  const currentCode = codeMap[language] ?? activeLang.placeholder;

  useEffect(() => {
    if (monaco) {
      // Setup custom theme for Monaco matching our dark UI
      monaco.editor.defineTheme('interview-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#09090b', // Matches our tailwind background
          'editor.lineHighlightBackground': '#18181b',
        }
      });
      monaco.editor.setTheme('interview-dark');
    }
  }, [monaco]);

  const handleEditorChange = (value: string | undefined) => {
    setCodeMap(prev => ({ ...prev, [language]: value || '' }));
  };

  const handleRun = () => {
    if (!currentCode.trim() || executeCode.isPending || disabled) return;
    executeCode.mutate({ code: currentCode, language, testCases: cases });
  };

  const handleSubmit = () => {
    if (!currentCode.trim() || submitLoading || disabled) return;
    onSubmit(currentCode);
  };

  const result = executeCode.data;

  return (
    <div className='space-y-3 flex flex-col h-full'>
      {/* Toolbar */}
      <div className='flex items-center justify-between gap-2 shrink-0'>
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
            disabled={!currentCode.trim() || executeCode.isPending || disabled}
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
            disabled={!currentCode.trim() || submitLoading || disabled}
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

      {/* Editor Container */}
      <div className={cn(
        'w-full rounded-lg border border-border overflow-hidden bg-[#09090b] flex-1 min-h-[300px] shadow-inner',
        disabled && 'opacity-50 pointer-events-none'
      )}>
        <Editor
          height="100%"
          language={activeLang.monacoLang}
          value={currentCode}
          onChange={handleEditorChange}
          theme="interview-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineHeight: 1.5,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            formatOnPaste: true,
          }}
        />
      </div>

      {/* Execution error */}
      {executeCode.isError && (
        <div className='flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive shrink-0'>
          <AlertCircle className='size-3.5 shrink-0' />
          {(executeCode.error as any)?.response?.data?.error?.message ??
            (executeCode.error as any)?.message ??
            'Code execution failed'}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className='space-y-2 shrink-0 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar'>
          {/* Summary */}
          <div
            className={cn(
              'flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium sticky top-0 backdrop-blur-md z-10',
              result.success
                ? 'border-green-500/20 bg-green-500/10 text-green-400'
                : 'border-red-500/20 bg-red-500/10 text-red-400',
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
          {result.testCaseResults && result.testCaseResults.length > 0 && (
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
