import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AssistantSettings } from '@/components/assistants/assistant-settings';

export default async function AssistantSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');

  const assistant = await prisma.assistant.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!assistant) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/assistants/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to chat
      </Link>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-text-base">
          {assistant.name} settings
        </h2>
        <p className="text-sm text-muted">
          Edit instructions, grab your embed code, or delete this assistant.
        </p>
      </div>
      <AssistantSettings
        id={assistant.id}
        name={assistant.name}
        persona={assistant.persona}
        instructions={assistant.instructions}
        knowledgeBase={assistant.knowledgeBase}
        widgetKey={assistant.widgetKey}
      />
    </div>
  );
}
