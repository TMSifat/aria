import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';

/**
 * Provider-agnostic chat streaming.
 *
 * Provider selection:
 *   1. AI_PROVIDER=google | anthropic forces a provider.
 *   2. Otherwise: GOOGLE_API_KEY set → Gemini; else → Claude.
 *
 * Models are env-configurable:
 *   GOOGLE_MODEL     (default: gemini-2.5-flash)
 *   ANTHROPIC_MODEL  (default: claude-sonnet-4-6)
 */

export type AiProvider = 'google' | 'anthropic';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface StreamChatOptions {
  system: string;
  history: ChatTurn[];
  message: string;
  maxTokens?: number;
  /** Called for every text delta as it streams in. */
  onText: (text: string) => void;
}

export function activeProvider(): AiProvider {
  const forced = process.env.AI_PROVIDER;
  if (forced === 'google' || forced === 'anthropic') return forced;
  return process.env.GOOGLE_API_KEY ? 'google' : 'anthropic';
}

// "-latest" alias tracks Google's current flash model — pinned versions get
// retired (gemini-2.5-flash started 404ing for this key in July 2026).
// Retired pinned models are remapped in code so a stale GOOGLE_MODEL env var
// (e.g. on Vercel) can never break chat again.
const RETIRED_GOOGLE_MODELS = new Set(['gemini-2.5-flash']);
const envGoogleModel = process.env.GOOGLE_MODEL;
const GOOGLE_MODEL =
  envGoogleModel && !RETIRED_GOOGLE_MODELS.has(envGoogleModel)
    ? envGoogleModel
    : 'gemini-flash-latest';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

async function streamGoogle(opts: StreamChatOptions): Promise<StreamUsage> {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

  const contents = [
    ...opts.history.map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    })),
    { role: 'user' as const, parts: [{ text: opts.message }] },
  ];

  const stream = await ai.models.generateContentStream({
    model: GOOGLE_MODEL,
    contents,
    config: {
      systemInstruction: opts.system,
      maxOutputTokens: opts.maxTokens ?? 1024,
      // Newer flash models "think" by default and can burn the entire token
      // budget on internal reasoning (truncated/garbled replies). Assistants
      // here want fast, direct answers — disable thinking.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const usage: StreamUsage = { inputTokens: 0, outputTokens: 0 };
  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) opts.onText(text);
    // usageMetadata arrives on the final chunk(s); keep the latest values.
    const meta = chunk.usageMetadata;
    if (meta) {
      usage.inputTokens = meta.promptTokenCount ?? usage.inputTokens;
      usage.outputTokens = meta.candidatesTokenCount ?? usage.outputTokens;
    }
  }
  return usage;
}

async function streamAnthropic(opts: StreamChatOptions): Promise<StreamUsage> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = anthropic.messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: [
      ...opts.history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: opts.message },
    ],
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      opts.onText(event.delta.text);
    }
  }

  const finalMessage = await stream.finalMessage();
  return {
    inputTokens: finalMessage.usage.input_tokens,
    outputTokens: finalMessage.usage.output_tokens,
  };
}

/**
 * Streams a reply from the active provider. Text deltas are delivered through
 * `onText`; resolves with token usage once the stream completes.
 */
export async function streamAssistantReply(
  opts: StreamChatOptions,
): Promise<StreamUsage> {
  return activeProvider() === 'google'
    ? streamGoogle(opts)
    : streamAnthropic(opts);
}
