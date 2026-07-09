import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AssistantForm } from '@/components/assistants/assistant-form';

export default function NewAssistantPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/assistants"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to assistants
      </Link>
      <AssistantForm />
    </div>
  );
}
