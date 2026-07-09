import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChatInterface } from '@/components/assistants/chat-interface';

export default async function AssistantChatPage({
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

  const messageCount = await prisma.usageLog.count({
    where: { userId: session.user.id, assistantId: id },
  });

  return (
    <ChatInterface
      assistantId={assistant.id}
      name={assistant.name}
      persona={assistant.persona}
      widgetKey={assistant.widgetKey}
      messageCount={messageCount}
    />
  );
}
