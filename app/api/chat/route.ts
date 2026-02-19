import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getCollection } from '@/lib/mongodb';

const SYSTEM_PROMPT = `You are a knowledgeable, friendly personal fitness coach embedded in a workout tracking app called Velon. Your role:

- Give concise, actionable fitness advice (training, nutrition, recovery, form).
- When the user asks about their workouts, reference the provided workout history data.
- Be encouraging but honest. If something looks off (e.g. too much volume, no rest days), flag it.
- Keep responses short (2-4 paragraphs max) unless the user asks for detail.
- Use plain language, no jargon without explanation.
- If you don't have enough data, say so and suggest what the user should log.
- Never give medical advice; recommend seeing a professional for injuries/health concerns.
- Format responses with markdown for readability (bold, bullet points, etc.).`;

/** Models to try in order — lite has the most generous free-tier limits */
const MODELS = ['gemini-2.5-flash-lite'] as const;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callGemini(ai: GoogleGenAI, prompt: string): Promise<string> {
  let lastError: unknown;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({ model, contents: prompt });
        return response.text ?? '';
      } catch (err: unknown) {
        lastError = err;
        const status = (err as { status?: number }).status;

        if (status === 429) {
          // Rate-limited — wait and retry once, then try next model
          if (attempt === 0) {
            console.warn(`Rate limited on ${model}, retrying in 3s...`);
            await sleep(3000);
            continue;
          }
          console.warn(`Rate limited on ${model} after retry, trying next model...`);
          break; // move to next model
        }
        // Non-429 error — don't retry
        throw err;
      }
    }
  }

  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    const { message, userId, includeWorkoutData } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Optionally fetch recent workout data for context
    let workoutContext = '';
    if (includeWorkoutData && userId) {
      workoutContext = await buildWorkoutContext(userId);
    }

    const ai = new GoogleGenAI({ apiKey });

    const userPrompt = workoutContext
      ? `${SYSTEM_PROMPT}\n\n--- USER'S RECENT WORKOUT DATA ---\n${workoutContext}\n--- END DATA ---\n\nUser message: ${message}`
      : `${SYSTEM_PROMPT}\n\nUser message: ${message}`;

    const text = await callGemini(ai, userPrompt);

    return NextResponse.json({ reply: text || 'I didn\'t get a response — please try again.' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Chat API error:', error);

    const status = (error as { status?: number }).status;
    if (status === 429) {
      return NextResponse.json(
        { error: 'The AI coach is getting too many requests right now. Please wait a moment and try again.' },
        { status: 429 },
      );
    }

    return NextResponse.json({ error: 'Failed to generate response. Please try again.' }, { status: 500 });
  }
}

async function buildWorkoutContext(userId: string): Promise<string> {
  try {
    const usersCol = await getCollection('User');
    const user = await usersCol.findOne({ email: userId });
    if (!user) return 'No user data available.';

    const sessCol = await getCollection('WorkoutSession');
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const sessions = await sessCol
      .find({ userId: user._id.toString(), date: { $gte: fourWeeksAgo } })
      .sort({ date: -1 })
      .limit(20)
      .toArray();

    if (!sessions.length) return 'No workout sessions logged in the past 4 weeks.';

    const lines = sessions.map(s => {
      const date = new Date(s.date).toLocaleDateString();
      const exList = (s.exercises ?? []).map((e: { exerciseName: string; sets: { weight: number; reps: number; rpe?: number; isFailure: boolean }[] }) => {
        const setsSummary = e.sets.map(
          (set: { weight: number; reps: number; rpe?: number; isFailure: boolean }) =>
            `${set.weight}×${set.reps}${set.rpe ? ` RPE${set.rpe}` : ''}${set.isFailure ? '(F)' : ''}`
        ).join(', ');
        return `  - ${e.exerciseName}: ${setsSummary}`;
      }).join('\n');
      return `${date} [${s.goal}]${s.duration ? ` ${s.duration}min` : ''}\n${exList}`;
    });

    return `${sessions.length} sessions in last 4 weeks:\n${lines.join('\n\n')}`;
  } catch (err) {
    console.error('Failed to build workout context:', err);
    return 'Could not retrieve workout data.';
  }
}
