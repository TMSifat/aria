'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { createAssistant } from '@/lib/actions/assistants';

const STEP_LABELS = ['Identity', 'Instructions', 'Knowledge', 'Review'];

export function AssistantForm() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState('');
  const [persona, setPersona] = React.useState('');
  const [instructions, setInstructions] = React.useState('');
  const [knowledgeBase, setKnowledgeBase] = React.useState('');

  function next() {
    setError(null);
    if (step === 1) {
      if (!name.trim()) return setError('Name is required.');
      if (name.length > 50) return setError('Name must be 50 characters or fewer.');
    }
    if (step === 2 && instructions.trim().length < 20) {
      return setError('Instructions must be at least 20 characters.');
    }
    setStep((s) => Math.min(4, s + 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await createAssistant({
      name,
      persona,
      instructions,
      knowledgeBase,
    });
    if (!res.ok) {
      setSubmitting(false);
      setError(res.error);
      toast.error(res.error);
      return;
    }
    toast.success('Assistant created!');
    router.push(`/assistants/${res.data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                    active
                      ? 'bg-primary text-white shadow-teal'
                      : done
                        ? 'bg-primary/20 text-primary-text'
                        : 'bg-surface-raised text-muted',
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : n}
                </div>
                <span
                  className={cn(
                    'hidden text-xs font-medium sm:inline',
                    active ? 'text-text-base' : 'text-muted',
                  )}
                >
                  {label}
                </span>
              </div>
              {n < 4 && (
                <div className="mx-2 h-px flex-1 bg-border" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <Card className="p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive-dim px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                maxLength={50}
                onChange={(e) => setName(e.target.value)}
                placeholder="Support Bot"
              />
              <div className="text-right text-xs text-muted">
                {name.length}/50
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="persona">Persona</Label>
              <Input
                id="persona"
                value={persona}
                maxLength={100}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="A friendly support agent"
              />
              <div className="text-right text-xs text-muted">
                {persona.length}/100
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-1.5">
            <Label htmlFor="instructions">
              Instructions <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="instructions"
              value={instructions}
              rows={8}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe how your assistant should behave, its tone, what it can and can't help with..."
            />
            <div className="flex justify-between text-xs text-muted">
              <span>Minimum 20 characters</span>
              <span>{instructions.length} characters</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="knowledge">Knowledge base</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-muted">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  This content is provided to your assistant as context.
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id="knowledge"
              value={knowledgeBase}
              rows={8}
              onChange={(e) => setKnowledgeBase(e.target.value)}
              placeholder="Paste product documentation, FAQs, pricing info..."
            />
            <p className="text-xs text-muted">Optional but recommended.</p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-base">Review</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-muted">Name</dt>
                <dd className="text-text-base">{name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted">Persona</dt>
                <dd className="text-text-base">
                  {persona || <span className="text-muted">—</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted">Instructions</dt>
                <dd className="whitespace-pre-wrap text-text-base">
                  {instructions}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted">
                  Knowledge base
                </dt>
                <dd className="whitespace-pre-wrap text-text-base">
                  {knowledgeBase || <span className="text-muted">—</span>}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 1 || submitting}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {step < 4 ? (
            <Button onClick={next}>
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Assistant
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
