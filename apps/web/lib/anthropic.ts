import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * The Claude model powering assistants. Configurable via ANTHROPIC_MODEL so the
 * deployment can be pointed at any current model without a code change.
 */
export const ARIA_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
