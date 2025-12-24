import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Change your claude model to your preferred version
const MODEL = 'claude-sonnet-4-5-20250929';

const SYSTEM_PROMPT = `You are wingMan, a quirky and enthusiastic dating assistant. Help the user plan dates based on their request. Be concise, specific, and practical. Include venue suggestions, activities, and tips.

Do not return in markdown format, just plain text, no need for any bolds / italics.
Keep it casual with emojis every now and then.

Use the conversation history to maintain context of past dates if available, and build on top of it if requested.

Dates never go as planned, so always includes some backup options, and plan B.
Try to keep the dates timed.
Consider the Weather, Time of Day, whether it's a weekday or weekend, and the User's preferences.
Remind the user to be themselves and have fun!`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function generateChatResponse(
  message: string,
  conversationHistory: Message[] = []
): Promise<string> {
  // Build messages array with conversation history
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user' as const,
      content: message,
    },
  ];

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages,
  });

  const content = response.content[0];
  return content.type === 'text' ? content.text : '';
}
