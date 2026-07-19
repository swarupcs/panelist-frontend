// src/pages/recruiter/RecruiterSetupPage.tsx
//
// Becoming a recruiter.
//
// There is no "are you a recruiter?" question at signup, because a
// self-declared role is unverified the moment it is given and stale shortly
// after. Somebody becomes a recruiter by doing this — and the recruiter view
// appears as a consequence of the profile existing, not because a flag was
// ticked.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Seo } from '@/components/common/Seo';
import { useAvailableViews, useSetupRecruiter } from '@/hooks/useRecruiter';

export default function RecruiterSetupPage() {
  const navigate = useNavigate();
  const { profile, setView } = useAvailableViews();
  const setup = useSetupRecruiter();

  const [companyName, setCompanyName] = useState(profile?.companyName ?? '');
  // Acceptance is never cleared once given, so an existing recruiter editing
  // their company name is not asked to agree all over again.
  const alreadyAccepted = Boolean(profile?.dpaAcceptedAt);
  const [acceptDpa, setAcceptDpa] = useState(alreadyAccepted);

  const canSubmit = companyName.trim().length > 0 && (alreadyAccepted || acceptDpa);

  const handleSubmit = async () => {
    await setup.mutateAsync({ companyName: companyName.trim(), acceptDpa });
    setView('recruiter');
    navigate('/recruiter');
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 md:p-6">
      <Seo title="Set up hiring" description="Set up to interview candidates on Panelist." noIndex />

      <div>
        <h1 className="text-2xl font-bold">Set up to hire</h1>
        <p className="text-sm text-muted-foreground">
          Define an interview once, then invite candidates to sit it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-primary" />
            Your company
          </CardTitle>
          <CardDescription>
            Candidates see this name on their invitation, so use the one they will
            recognise.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
            />
          </div>

          {/* Not a formality. Whoever assesses a candidate is the data
              controller for that assessment, and without an agreement saying
              so there is no lawful basis for the processing done on their
              behalf. It gates invitations rather than this page, so somebody
              can look around before agreeing to anything. */}
          {!alreadyAccepted && (
            <label className="flex cursor-pointer gap-3 rounded-lg border border-border/60 p-4">
              <input
                type="checkbox"
                checked={acceptDpa}
                onChange={(e) => setAcceptDpa(e.target.checked)}
                className="mt-0.5 size-4 shrink-0"
              />
              <span className="space-y-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="size-3.5 text-primary" />
                  Data processing agreement
                </span>
                <span className="block text-xs text-muted-foreground">
                  You decide who to assess and what to do with the result, which makes
                  you the data controller for it. Panelist processes candidate data on
                  your instructions. You are responsible for telling candidates what you
                  collect and for keeping it only as long as you need it.
                </span>
              </span>
            </label>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || setup.isPending}
            size="lg"
            className="w-full gap-2"
          >
            {setup.isPending && <Loader2 className="size-4 animate-spin" />}
            {profile ? 'Save' : 'Start hiring'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            You can still practise interviews yourself — this adds a second view, it
            does not replace anything.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
