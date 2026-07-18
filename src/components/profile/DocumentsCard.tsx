// src/components/profile/DocumentsCard.tsx
//
// Files attached to the account.
//
// The upload, list and delete endpoints have all existed for a while and the
// client had methods for every one of them — but nothing rendered any of it, so
// there was no way to upload a file, and no way to see one if you had.

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fileApi } from '@/api/user.api';
import { formatRelative } from '@/utils/formatters';

/** Matches the backend FileCategory enum. */
const CATEGORIES = [
  { value: 'RESUME', label: 'Resume' },
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'CODE_FILE', label: 'Code' },
  { value: 'DIAGRAM', label: 'Diagram' },
  { value: 'SCREENSHOT', label: 'Screenshot' },
  { value: 'OTHER', label: 'Other' },
] as const;

/** 1 kB is 1024 here to match how the backend reports size. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsCard() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string>('RESUME');

  const { data, isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => fileApi.getUserFiles(),
  });

  const upload = useMutation({
    mutationFn: (file: File) => fileApi.uploadFile(file, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('Uploaded.');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Upload failed.';
      toast.error(message);
    },
  });

  const remove = useMutation({
    mutationFn: (fileId: string) => fileApi.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('Deleted.');
    },
    onError: () => toast.error('Could not delete the file.'),
  });

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    // Reset so picking the same file twice still fires a change event.
    e.target.value = '';
  };

  const files = data?.files ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            aria-label="File category"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <input ref={inputRef} type="file" onChange={handlePick} className="hidden" />
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="gap-2"
          >
            {upload.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing uploaded yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    {/* The stored URL may be an S3 key rather than a fetchable
                        link, so the name is only a link when it looks like one. */}
                    {file.url?.startsWith('http') ? (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {file.originalName}
                      </a>
                    ) : (
                      <p className="truncate text-sm font-medium">{file.originalName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {CATEGORIES.find((c) => c.value === file.category)?.label ?? file.category}
                      {' · '}
                      {formatSize(file.size)}
                      {file.createdAt && ` · ${formatRelative(file.createdAt)}`}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove.mutate(file.id)}
                  disabled={remove.isPending}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${file.originalName}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default DocumentsCard;
