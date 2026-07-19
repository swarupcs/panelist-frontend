// src/components/recruiter/TemplateDialog.tsx
//
// Defining an interview.
//
// Every setting here is fixed for every candidate who sits it. That is the
// point: two results only mean something side by side if both people got the
// same interview, which is also why adaptive difficulty is not offered — it
// gives each candidate a different one by design.

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTemplate } from '@/hooks/useRecruiter';

const TYPES = [
  { value: 'DSA', label: 'Data structures & algorithms' },
  { value: 'BACKEND', label: 'Backend' },
  { value: 'FRONTEND', label: 'Frontend' },
  { value: 'SYSTEM_DESIGN', label: 'System design' },
  { value: 'BEHAVIORAL', label: 'Behavioural' },
  { value: 'DEVOPS', label: 'DevOps' },
  { value: 'MOBILE', label: 'Mobile' },
  { value: 'MIXED', label: 'Mixed' },
] as const;

const LANGUAGES = [
  'JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'CPP', 'CSHARP', 'GO', 'RUST',
] as const;

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

export function TemplateDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const create = useCreateTemplate();

  const [name, setName] = useState('');
  const [type, setType] = useState<string>('DSA');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [language, setLanguage] = useState<string>('');
  const [requireRecording, setRequireRecording] = useState(true);
  const [requireCamera, setRequireCamera] = useState(false);
  const [allowHints, setAllowHints] = useState(false);
  const [candidateSeesResult, setCandidateSeesResult] = useState(true);

  const handleCreate = async () => {
    await create.mutateAsync({
      name: name.trim(),
      type,
      difficulty,
      durationMinutes,
      language: language || null,
      requireRecording,
      requireCamera,
      allowHints,
      candidateSeesResult,
    });
    setName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New interview</DialogTitle>
          <DialogDescription>
            Every candidate you invite to this will sit exactly the same interview.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tname">Name</Label>
            <Input
              id="tname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Senior Backend — round 1"
            />
            <p className="text-xs text-muted-foreground">
              Candidates see this, so name the role rather than the stage.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ttype">Type</Label>
              <select
                id="ttype"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tdiff">Difficulty</Label>
              <select
                id="tdiff"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tdur">Duration</Label>
              <select
                id="tdur"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {/* One question per 15 minutes, so these are question counts
                    in disguise. */}
                <option value={30}>30 minutes (2 questions)</option>
                <option value={45}>45 minutes (3 questions)</option>
                <option value={60}>60 minutes (4 questions)</option>
                <option value={90}>90 minutes (6 questions)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tlang">Language</Label>
              <select
                id="tlang"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Candidate chooses</option>
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l.charAt(0) + l.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Toggle
              label="Record the candidate's screen"
              hint="You review how they worked, not just their answers. They are told before they start and can decline the interview."
              checked={requireRecording}
              onChange={setRequireRecording}
            />
            {/* Only meaningful alongside a screen recording, and worth its
                own decision: it is the strongest identity signal short of an
                ID check, and it also excludes candidates without a private
                space or a decent connection. */}
            {requireRecording && (
              <Toggle
                label="Record the candidate on camera"
                hint="Off by default. Makes impersonation much harder — and asks more of candidates without a quiet private space. A person reviews it; it is never analysed automatically."
                checked={requireCamera}
                onChange={setRequireCamera}
              />
            )}

            <Toggle
              label="Allow hints"
              hint="Off by default. A hint changes what the score means, so where hints are on, usage is reported next to the result."
              checked={allowHints}
              onChange={setAllowHints}
            />
            <Toggle
              label="Show candidates their own result"
              hint="They always know they were assessed. This decides whether they see the score."
              checked={candidateSeesResult}
              onChange={setCandidateSeesResult}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || create.isPending}
              className="gap-2"
            >
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateDialog;
