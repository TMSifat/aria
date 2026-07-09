'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteAssistant, updateAssistant } from '@/lib/actions/assistants';

interface Props {
  id: string;
  name: string;
  persona: string | null;
  instructions: string;
  knowledgeBase: string | null;
  widgetKey: string;
}

export function AssistantSettings({
  id,
  name: initialName,
  persona: initialPersona,
  instructions: initialInstructions,
  knowledgeBase: initialKnowledge,
  widgetKey,
}: Props) {
  const router = useRouter();
  const [name, setName] = React.useState(initialName);
  const [persona, setPersona] = React.useState(initialPersona ?? '');
  const [instructions, setInstructions] = React.useState(initialInstructions);
  const [knowledgeBase, setKnowledgeBase] = React.useState(
    initialKnowledge ?? '',
  );
  const [saving, setSaving] = React.useState(false);

  const [confirm, setConfirm] = React.useState('');
  const [deleting, setDeleting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const embedCode = `<script src="https://cdn.aria.ai/widget.js"\n        data-key="${widgetKey}"\n        data-theme="light"></script>`;

  async function save() {
    setSaving(true);
    const res = await updateAssistant(id, {
      name,
      persona,
      instructions,
      knowledgeBase,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success('Changes saved');
    router.refresh();
  }

  async function onDelete() {
    setDeleting(true);
    const res = await deleteAssistant(id);
    if (!res.ok) {
      setDeleting(false);
      toast.error(res.error);
      return;
    }
    toast.success('Assistant deleted');
    router.push('/assistants');
    router.refresh();
  }

  async function copyEmbed() {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Embed code copied');
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <h3 className="text-sm font-bold text-text-base">Assistant details</h3>
        <div className="space-y-1.5">
          <Label htmlFor="s-name">Name</Label>
          <Input
            id="s-name"
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-persona">Persona</Label>
          <Input
            id="s-persona"
            value={persona}
            maxLength={100}
            onChange={(e) => setPersona(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-instructions">Instructions</Label>
          <Textarea
            id="s-instructions"
            rows={6}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-knowledge">Knowledge base</Label>
          <Textarea
            id="s-knowledge"
            rows={6}
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </Card>

      <Card className="space-y-3 p-6">
        <h3 className="text-sm font-bold text-text-base">Embed code</h3>
        <p className="text-xs text-muted">
          The widget key is a <strong>public</strong> key — it only enables
          chat, not data access. Safe to expose on your site.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border-teal bg-surface-raised p-4 font-mono text-xs leading-relaxed text-primary-text">
          {embedCode}
        </pre>
        <Button variant="secondary" onClick={copyEmbed} className="w-fit">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy code'}
        </Button>
      </Card>

      <Card className="space-y-3 border-destructive/40 p-6">
        <h3 className="text-sm font-bold text-destructive">Danger zone</h3>
        <p className="text-xs text-muted">
          Deleting an assistant is permanent and removes all of its
          conversations.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-fit">
              <Trash2 className="h-4 w-4" />
              Delete this assistant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {initialName}?</DialogTitle>
              <DialogDescription>
                This cannot be undone. Type{' '}
                <strong className="text-text-base">{initialName}</strong> to
                confirm.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={initialName}
            />
            <DialogFooter>
              <Button
                variant="destructive"
                disabled={confirm !== initialName || deleting}
                onClick={onDelete}
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}
