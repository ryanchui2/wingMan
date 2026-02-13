import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { searchPlaces, getDistanceMatrix, getDirectionsUrl } from './googleMaps';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define function tools for the AI to use
const tools = {
  functionDeclarations: [
    {
      name: 'search_venues',
      description: 'Search for venues, restaurants, cafes, or places near a location. Returns details like ratings, opening hours, and addresses.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description: 'What to search for (e.g., "romantic restaurants", "coffee shops", "parks")',
          },
          location: {
            type: SchemaType.STRING,
            description: 'Location to search near (e.g., "San Francisco, CA" or lat,lng format)',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'calculate_distance',
      description: 'Calculate distance and travel time between locations. Useful for planning routes and timing.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          origins: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: 'Starting locations (addresses or place names)',
          },
          destinations: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: 'Destination locations (addresses or place names)',
          },
          mode: {
            type: SchemaType.STRING,
            description: 'Mode of transportation',
          },
        },
        required: ['origins', 'destinations'],
      },
    },
  ],
};

// https://ai.google.dev/gemini-api/docs/models

const MODEL = 'gemini-3-flash-preview';

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

// Helper function to execute tool calls
async function executeFunctionCall(functionName: string, args: Record<string, unknown>): Promise<unknown> {
  switch (functionName) {
    case 'search_venues':
      const places = await searchPlaces(
        args.query as string,
        args.location as string | undefined
      );
      return places.map((p) => ({
        name: p.name,
        address: p.formatted_address,
        rating: p.rating,
        total_ratings: p.user_ratings_total,
        price_level: p.price_level,
        open_now: p.opening_hours?.open_now,
        types: p.types?.slice(0, 3), // Limit to 3 types
      }));

    case 'calculate_distance':
      const distances = await getDistanceMatrix(
        args.origins as string[],
        args.destinations as string[],
        (args.mode as 'driving' | 'walking' | 'transit' | 'bicycling') || 'driving'
      );
      return distances.map((d) => ({
        from: d.origin,
        to: d.destination,
        distance: d.distance.text,
        duration: d.duration.text,
        distance_meters: d.distance.value,
        duration_seconds: d.duration.value,
      }));

    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}

export async function generateChatResponse(
  message: string,
  conversationHistory: Message[] = [],
  userProfile: UserProfile | null = null,
  pastDates: PastDate[] | null = null
): Promise<string> {
  // Build system prompt with user profile and past dates if available
  let systemPrompt = buildSystemPrompt(userProfile, pastDates);

  // Add instructions for using tools
  systemPrompt += `\n\nIMPORTANT - TOOL USAGE:
You have access to real-time tools that you MUST use by calling them (not by showing code):
- search_venues: Find real venues with ratings, hours, and addresses
- calculate_distance: Get actual travel times between locations

CRITICAL RULES:
1. CALL THE TOOLS DIRECTLY - don't show code examples or explain how to use them
2. When suggesting venues, you MUST call search_venues first to get real places
3. When discussing travel between locations, you MUST call calculate_distance to get accurate times
4. NEVER write code examples like "print(calculate_distance(...))" - just call the function
5. Present the tool results naturally in your response without mentioning you used a tool

The user sees your final response, not the tool calls. Use the tools silently to get data, then provide a natural, helpful response with that information.`;

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: systemPrompt,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [tools] as any,
  });

  // Convert conversation history to Gemini format
  const history = conversationHistory.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history,
  });

  let result = await chat.sendMessage(message);
  let response = result.response;

  // Handle function calls
  let functionCalls = response.functionCalls();

  while (functionCalls && functionCalls.length > 0) {
    // Execute all function calls and format responses
    const parts = [];
    for (const call of functionCalls) {
      const functionResult = await executeFunctionCall(call.name, (call.args || {}) as Record<string, unknown>);
      parts.push({
        functionResponse: {
          name: call.name,
          response: {
            result: functionResult,
          },
        },
      });
    }

    // Send function results back to the model
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result = await chat.sendMessage(parts as any);
    response = result.response;
    functionCalls = response.functionCalls();
  }

  return response.text();
}
