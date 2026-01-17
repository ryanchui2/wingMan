import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Change your claude model to your preferred version
const MODEL = 'claude-sonnet-4-5-20250929';

const BASE_SYSTEM_PROMPT = `You are wingMan, a quirky and enthusiastic dating assistant. Help the user plan dates based on their request. Be concise, specific, and practical. Include venue suggestions, activities, and tips.

Keep it casual with emojis every now and then.
Use the conversation history to maintain context of past dates if available, and build on top of it if requested.
Dates never go as planned, so always includes some backup options, and plan B.
Try to keep the dates timed.
Consider the Weather, Time of Day, whether it's a weekday or weekend, and the User's preferences.
Remind the user to be themselves and have fun!

users might ask for reponses such as analysing their past dates, suggesting new date ideas, or other dating advice. Use the context provided to look up the best possible advice.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UserProfile {
  age: number | null;
  location: string | null;
  gender: string | null;
  interests: string | null;
  datingGoals: string | null;
  datingStyle: string | null;
  budget: string | null;
  outdoor: boolean | null;
  social: boolean | null;
  dietaryRestrictions: string | null;
  additionalNotes: string | null;
}

interface PastDate {
  name: string;
  rating: number | null;
  notes: string | null;
  createdAt: Date;
}

function buildSystemPrompt(profile: UserProfile | null, pastDates: PastDate[] | null): string {
  let prompt = BASE_SYSTEM_PROMPT;

  // Add profile context
  if (profile) {
    const profileContext: string[] = [];

    if (profile.age) profileContext.push(`Age: ${profile.age}`);
    if (profile.gender) profileContext.push(`Gender: ${profile.gender}`);
    if (profile.location) profileContext.push(`Location: ${profile.location}`);
    if (profile.interests) profileContext.push(`Interests: ${profile.interests}`);
    if (profile.datingGoals) profileContext.push(`Dating goals: ${profile.datingGoals}`);
    if (profile.datingStyle) profileContext.push(`Dating style: ${profile.datingStyle}`);
    if (profile.budget) profileContext.push(`Budget preference: ${profile.budget}`);
    if (profile.outdoor !== null) profileContext.push(`Outdoor activities: ${profile.outdoor ? 'enjoys' : 'prefers indoor'}`);
    if (profile.social !== null) profileContext.push(`Social settings: ${profile.social ? 'enjoys social settings' : 'prefers quieter settings'}`);
    if (profile.dietaryRestrictions) profileContext.push(`Dietary restrictions: ${profile.dietaryRestrictions}`);
    if (profile.additionalNotes) profileContext.push(`Additional context: ${profile.additionalNotes}`);

    if (profileContext.length > 0) {
      prompt += `

USER PROFILE:
${profileContext.join('\n')}

Use this profile information to personalize your advice and suggestions. Tailor date ideas to their location, interests, budget, and preferences.`;
    }
  }

  // Add past dates history for learning and improvement
  if (pastDates && pastDates.length > 0) {
    const dateHistory: string[] = [];

    pastDates.forEach((date, index) => {
      const dateInfo: string[] = [`${index + 1}. "${date.name}"`];

      if (date.rating !== null) {
        dateInfo.push(`   Rating: ${date.rating}/5 stars`);
      }

      if (date.notes) {
        dateInfo.push(`   Feedback: ${date.notes}`);
      }

      dateHistory.push(dateInfo.join('\n'));
    });

    prompt += `

PAST DATE HISTORY:
The user has rated and provided feedback on ${pastDates.length} past date${pastDates.length > 1 ? 's' : ''}. Learn from what worked and what didn't to improve future suggestions:

${dateHistory.join('\n\n')}

Use this feedback to:
- Suggest similar ideas to highly-rated dates
- Avoid repeating issues from poorly-rated dates
- Understand the user's preferences based on their actual experiences
- Tailor your recommendations to what has proven successful for them`;
  }

  return prompt;
}

export async function generateChatResponse(
  message: string,
  conversationHistory: Message[] = [],
  userProfile: UserProfile | null = null,
  pastDates: PastDate[] | null = null
): Promise<string> {
  // Build system prompt with user profile and past dates if available
  const systemPrompt = buildSystemPrompt(userProfile, pastDates);

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
    system: systemPrompt,
    messages,
  });

  const content = response.content[0];
  return content.type === 'text' ? content.text : '';
}
