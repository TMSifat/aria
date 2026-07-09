import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listApiKeys } from '@/lib/actions/api-keys';
import { KeyTable } from '@/components/api-keys/key-table';

export default async function ApiKeysPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const keys = await listApiKeys();

  return (
    <div className="mx-auto max-w-[1060px] space-y-7">
      <KeyTable initialKeys={keys} />
    </div>
  );
}
