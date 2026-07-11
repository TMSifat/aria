'use client';

import * as React from 'react';
import { Check, Copy, KeyRound, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type MaskedApiKey,
} from '@/lib/actions/api-keys';
import { formatDate } from '@/lib/utils';

export function KeyTable({ initialKeys }: { initialKeys: MaskedApiKey[] }) {
  const [keys, setKeys] = React.useState(initialKeys);

  // Create dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [createdKey, setCreatedKey] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Revoke dialog state
  const [revokeTarget, setRevokeTarget] = React.useState<MaskedApiKey | null>(
    null,
  );
  const [revoking, setRevoking] = React.useState(false);

  async function refresh() {
    const next = await listApiKeys();
    setKeys(next);
  }

  async function onCreate() {
    if (!name.trim()) return;
    setCreating(true);
    const res = await createApiKey(name.trim());
    setCreating(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setCreatedKey(res.data.key);
    await refresh();
  }

  async function copyKey() {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    toast.success('API key copied');
    setTimeout(() => setCopied(false), 1600);
  }

  function closeCreate() {
    setCreateOpen(false);
    setName('');
    setCreatedKey(null);
    setCopied(false);
  }

  async function onRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    const res = await revokeApiKey(revokeTarget.id);
    setRevoking(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success('API key revoked');
    setRevokeTarget(null);
    await refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h2 className="font-display text-[30px] font-bold tracking-[-0.03em]">
            API Keys<span className="text-primary">.</span>
          </h2>
          <p className="mt-1.5 text-[14.5px] text-muted">
            Scoped bearer keys for the Ariaay REST API.
          </p>
        </div>
        <Dialog
          open={createOpen}
          onOpenChange={(o) => (o ? setCreateOpen(true) : closeCreate())}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Create key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {!createdKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>Create API key</DialogTitle>
                  <DialogDescription>
                    Give the key a name so you can recognise it later.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5">
                  <Label htmlFor="key-name">Name</Label>
                  <Input
                    id="key-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Production server"
                    maxLength={50}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={onCreate} disabled={creating || !name.trim()}>
                    {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Your new API key</DialogTitle>
                  <DialogDescription>
                    Copy it now — it won&apos;t be shown again.
                  </DialogDescription>
                </DialogHeader>
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  Save this key somewhere safe. For security, we only store a
                  hash and cannot show it to you again.
                </div>
                <pre className="overflow-x-auto rounded-[10px] border border-border bg-surface-raised p-3 font-mono text-xs text-primary-text">
                  {createdKey}
                </pre>
                <DialogFooter className="sm:justify-between">
                  <Button variant="secondary" onClick={copyKey}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button onClick={closeCreate}>Done</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {keys.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <KeyRound className="h-8 w-8 text-muted" />
            <p className="text-sm text-muted">
              No API keys yet. Create one to get started.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-[10px] tracking-[0.16em] text-faint">
                  NAME
                </TableHead>
                <TableHead className="font-mono text-[10px] tracking-[0.16em] text-faint">
                  KEY
                </TableHead>
                <TableHead className="font-mono text-[10px] tracking-[0.16em] text-faint">
                  CREATED
                </TableHead>
                <TableHead className="font-mono text-[10px] tracking-[0.16em] text-faint">
                  LAST USED
                </TableHead>
                <TableHead className="font-mono text-[10px] tracking-[0.16em] text-faint">
                  STATUS
                </TableHead>
                <TableHead className="text-right font-mono text-[10px] tracking-[0.16em] text-faint">
                  ACTION
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.id} className="hover:bg-transparent">
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted">
                    {k.masked}
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {formatDate(k.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {k.lastUsedAt ? formatDate(k.lastUsedAt) : 'Never'}
                  </TableCell>
                  <TableCell>
                    {k.isActive ? (
                      <span className="font-mono text-[10px] tracking-[0.1em] text-success">
                        ● ACTIVE
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] tracking-[0.1em] text-destructive">
                        ● REVOKED
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {k.isActive && (
                      <button
                        type="button"
                        className="text-[12.5px] font-semibold text-destructive hover:opacity-75"
                        onClick={() => setRevokeTarget(k)}
                      >
                        Revoke
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <p className="max-w-[640px] text-[13px] leading-relaxed text-faint">
        Keys are shown in full exactly once, at creation, and stored as
        bcrypt hashes. Revoking a key immediately blocks any request using
        it.
      </p>

      <Dialog
        open={!!revokeTarget}
        onOpenChange={(o) => !o && setRevokeTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API key</DialogTitle>
            <DialogDescription>
              Revoking <strong>{revokeTarget?.name}</strong> immediately blocks
              any request using it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRevokeTarget(null)}
              disabled={revoking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onRevoke}
              disabled={revoking}
            >
              {revoking && <Loader2 className="h-4 w-4 animate-spin" />}
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
