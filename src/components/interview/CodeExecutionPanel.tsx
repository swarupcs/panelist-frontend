// src/components/interview/CodeExecutionPanel.tsx
//
// DSA code editor with language switching, test-case runner, and a
// Submit Code button that calls the parent onSubmit callback.

import { useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  Loader2,
  Lock,
  Play,
  Terminal,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useExecuteCode } from '@/hooks/useInterviewExtended';
import { useSubmitCode } from '@/hooks/usePanelist';
import { apiErrorMessage } from '@/lib/api-error';
import type {
  ProgrammingLanguage,
  TestCase,
  TestCaseResult,
} from '@/types/interview-extended';

// Language definitions

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

// Test case result row

function TestCaseRow({
  result,
  index,
}: {
  result: TestCaseResult;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  // The backend redacts hidden cases by replacing input and expected output
  // with this marker. Rendering it verbatim reads as though the test genuinely
  // received the string "[hidden]", which is confusing when a candidate is
  // trying to work out why a case failed.
  const isHidden = result.input === '[hidden]';
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
          {isHidden && (
            <span className='inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground'>
              <Lock className='size-2.5' />
              Hidden
            </span>
          )}
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

      {open && isHidden && (
        <div className='border-t border-border/50 px-3 py-2 space-y-1.5 bg-black/10'>
          <p className='text-muted-foreground'>
            This case is hidden - it counts towards your score, but its input is
            not shown. Make sure your solution handles edge cases you have not
            been given.
          </p>
          {result.error && (
            <div>
              <span className='text-muted-foreground'>Error: </span>
              <code className='text-red-400 whitespace-pre-wrap font-mono text-[11px] block mt-1 p-2 rounded bg-red-950/30 border border-red-500/20'>
                {result.error}
              </code>
            </div>
          )}
        </div>
      )}

      {open && !isHidden && (
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
                {typeof result.actualOutput === 'string' ? result.actualOutput : JSON.stringify(result.actualOutput) || result.error || 'No output'}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main component

interface CodeExecutionPanelProps {
  onSubmit: (code: string, language: ProgrammingLanguage) => void;
  testCases?: TestCase[];
  submitLoading?: boolean;
  disabled?: boolean;
  /**
   * When set, Run executes inside the interview session: the run is recorded on
   * the transcript and graded against the question's stored test cases rather
   * than whatever the client passes. Without it the panel falls back to the
   * standalone execution endpoint, which is fine for a scratchpad but leaves no
   * trace of the attempt.
   */
  sessionId?: string;
  questionIndex?: number;
}

export function CodeExecutionPanel({
  onSubmit,
  testCases,
  submitLoading = false,
  disabled = false,
  sessionId,
  questionIndex,
}: CodeExecutionPanelProps) {
  const [language, setLanguage] = useState<ProgrammingLanguage>('JAVASCRIPT');
  const [codeMap, setCodeMap] = useState<Partial<Record<ProgrammingLanguage, string>>>({});
  const [showLangMenu, setShowLangMenu] = useState(false);

  const executeCode = useExecuteCode();
  const trialRun = useSubmitCode(sessionId ?? '');
  const activeLang = LANGUAGES.find((lang) => lang.value === language)!;
  const cases = testCases && testCases.length > 0 ? testCases : DEFAULT_TEST_CASES;
  const currentCode = codeMap[language] ?? activeLang.placeholder;

  const handleEditorChange = (value: string | undefined) => {
    setCodeMap(prev => ({ ...prev, [language]: value || '' }));
  };

  const handleEditorMount: OnMount = (editor) => {
    // Focus only after Monaco has created its textarea. This makes the editor
    // ready for immediate typing without relying on an external CDN runtime.
    if (!disabled) editor.focus();
  };

  const isRunning = executeCode.isPending || trialRun.isPending;

  const handleRun = () => {
    if (!currentCode.trim() || isRunning || disabled) return;

    if (sessionId) {
      // Test cases are resolved server-side from the question, so they are the
      // same ones the submission is graded against and the client cannot hand
      // itself an easier suite.
      trialRun.mutate({ code: currentCode, language, questionIndex, final: false });
      return;
    }

    executeCode.mutate({ code: currentCode, language, testCases: cases });
  };

  const handleSubmit = () => {
    if (!currentCode.trim() || submitLoading || disabled) return;
    onSubmit(currentCode, language);
  };

  // Both paths report the same execution shape; the session run nests it.
  const result = sessionId ? trialRun.data?.execution : executeCode.data;

  return (
    <div className='space-y-3 flex flex-col h-full'>
      {/* Header / Toolbar */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2 shrink-0'>
        {/* Language selector */}
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
        <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto'>
          <button
            type='button'
            onClick={handleRun}
            disabled={!currentCode.trim() || isRunning || disabled}
            className={cn(
              'flex flex-1 sm:flex-none justify-center items-center gap-1.5 rounded-md border border-border px-3 py-1.5',
              'text-xs font-medium text-muted-foreground transition-colors',
              'hover:bg-secondary hover:text-foreground disabled:opacity-50',
            )}
          >
            {isRunning ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : (
              <Play className='size-3.5' />
            )}
            {isRunning ? 'Running...' : 'Run Tests'}
          </button>

          <button
            type='button'
            onClick={handleSubmit}
            disabled={!currentCode.trim() || submitLoading || disabled}
            className={cn(
              'flex flex-1 sm:flex-none justify-center items-center gap-1.5 rounded-md bg-primary px-3 py-1.5',
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
          height='100%'
          language={activeLang.monacoLang}
          value={currentCode}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme='vs-dark'
          options={{
            readOnly: disabled,
            domReadOnly: disabled,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineHeight: 21,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            automaticLayout: true,
          }}
        />
      </div>

      {/* Execution error */}
      {(sessionId ? trialRun.isError : executeCode.isError) && (
        <div className='flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive shrink-0'>
          <AlertCircle className='size-3.5 shrink-0' />
          {((sessionId ? trialRun.error : executeCode.error) as any)?.message ??
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
              <span className='text-muted-foreground'>All tests passed</span>
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
