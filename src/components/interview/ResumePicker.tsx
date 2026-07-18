// src/components/interview/ResumePicker.tsx
//
// Choose an uploaded resume, or upload one, and get its text back.
//
// This replaces asking people to paste their resume into a textarea. That was
// never a design decision — the upload endpoint stored the file without
// reading it, so pasting was the only way to get the text anywhere. Now that
// uploads are parsed, the document itself can be the input.
//
// The textarea is kept as a fallback rather than removed: a scanned PDF cannot
// be read, and someone with no file to hand should still be able to start.

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, FileText, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { fileApi } from '@/api/user.api';
import type { FileUpload } from '@/types';

interface ResumePickerProps {
  /** Raised with the selected resume's text, or '' when the selection clears. */
  onTextChange: (text: string) => void;
  /** Lets a parent show which file the text came from. */
  onFileChange?: (file: FileUpload | null) => void;
  className?: string;
}

export function ResumePicker({ onTextChange, onFileChange, className }: ResumePickerProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [showPaste, setShowPaste] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['files', 'RESUME'],
    queryFn: () => fileApi.getUserFiles('RESUME'),
  });

  const resumes = data?.files ?? [];

  const upload = useMutation({
    mutationFn: (file: File) => fileApi.uploadFile(file, 'RESUME'),
    onSuccess: async (result: FileUpload & { hasExtractedText?: boolean; extractionReason?: string }) => {
      await queryClient.invalidateQueries({ queryKey: ['files', 'RESUME'] });

      if (result.hasExtractedText) {
        setSelectedId(result.id);
        toast.success('Resume uploaded and read.');
      } else {
        // Uploading succeeded; only the reading failed. Say which, and open the
        // fallback rather than leaving the user at a dead end.
        toast.error(result.extractionReason ?? 'We could not read that file.');
        setShowPaste(true);
      }
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Upload failed.';
      toast.error(message);
    },
  });

  // Fetching the text is separate from selecting: the list deliberately does
  // not carry it, since a resume runs to tens of thousands of characters.
  const { data: textData, isFetching: isFetchingText } = useQuery({
    queryKey: ['file-text', selectedId],
    queryFn: () => fileApi.getFileText(selectedId as string),
    enabled: Boolean(selectedId),
  });

  useEffect(() => {
    if (showPaste) {
      onTextChange(pastedText);
      onFileChange?.(null);
      return;
    }

    if (textData?.text) {
      onTextChange(textData.text);
      onFileChange?.(resumes.find((r) => r.id === selectedId) ?? null);
    } else if (!selectedId) {
      onTextChange('');
      onFileChange?.(null);
    }
    // resumes is derived from the query cache and changes identity on every
    // render; including it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textData, selectedId, showPaste, pastedText]);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = '';
  };

  return (
    <div className={cn('space-y-3', className)}>
      {!showPaste && (
        <>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading your resumes…</p>
          ) : resumes.length > 0 ? (
            <ul className="space-y-2">
              {resumes.map((resume) => {
                const readable = resume.hasExtractedText !== false;
                const isSelected = resume.id === selectedId;

                return (
                  <li key={resume.id}>
                    <button
                      type="button"
                      // An unreadable resume is shown rather than hidden — it is
                      // in the user's list, and silently omitting it would look
                      // like the upload failed.
                      disabled={!readable}
                      onClick={() => setSelectedId(isSelected ? null : resume.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border/60 hover:border-border',
                        !readable && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{resume.originalName}</p>
                        {!readable && (
                          <p className="text-xs text-amber-500">
                            {resume.metadata?.extractionReason ?? 'This file could not be read.'}
                          </p>
                        )}
                      </div>
                      {isSelected &&
                        (isFetchingText ? (
                          <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                        ) : (
                          <Check className="size-4 shrink-0 text-primary" />
                        ))}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <FileText className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No resume uploaded yet</p>
              <p className="text-xs text-muted-foreground">
                PDF or .docx works best — we&rsquo;ll read it automatically.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf"
              onChange={handlePick}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={upload.isPending}
              className="gap-2"
            >
              {upload.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Upload a resume
            </Button>

            <button
              type="button"
              onClick={() => setShowPaste(true)}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              or paste the text instead
            </button>
          </div>
        </>
      )}

      {showPaste && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="size-3" />
              Pasting works too — the questions are built from this text either way.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowPaste(false);
                setPastedText('');
              }}
              className="shrink-0 text-xs text-muted-foreground underline hover:text-foreground"
            >
              use a file
            </button>
          </div>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your resume here — experience, projects, and the technologies you used."
            className="min-h-[180px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      )}
    </div>
  );
}

export default ResumePicker;
