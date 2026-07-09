import Link from 'next/link';
import { listUsers } from '@/lib/admin';
import { formatDate } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <div className="mx-auto max-w-[1060px] space-y-7">
      <div>
        <h2 className="font-display text-[30px] font-bold tracking-[-0.03em]">
          Users<span className="text-primary">.</span>
        </h2>
        <p className="mt-1.5 text-[14.5px] text-muted">
          {users.length} account{users.length === 1 ? '' : 's'} total.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {users.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted">
            No users yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-[10px] tracking-[0.16em] text-faint">
                  NAME
                </TableHead>
                <TableHead className="font-mono text-[10px] tracking-[0.16em] text-faint">
                  EMAIL
                </TableHead>
                <TableHead className="font-mono text-[10px] tracking-[0.16em] text-faint">
                  PLAN
                </TableHead>
                <TableHead className="font-mono text-[10px] tracking-[0.16em] text-faint">
                  ASSISTANTS
                </TableHead>
                <TableHead className="font-mono text-[10px] tracking-[0.16em] text-faint">
                  JOINED
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
              {users.map((u) => (
                <TableRow key={u.id} className="hover:bg-transparent">
                  <TableCell className="font-medium">
                    {u.name ?? 'Unnamed'}
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {u.email}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted">
                    {u.plan}
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {u.assistantCount}
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell>
                    {u.suspended ? (
                      <span className="font-mono text-[10px] tracking-[0.1em] text-destructive">
                        ● SUSPENDED
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] tracking-[0.1em] text-success">
                        ● ACTIVE
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/users/${u.id}`}>
                      <span className="text-[12.5px] font-semibold text-primary">
                        View
                      </span>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
