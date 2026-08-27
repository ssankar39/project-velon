import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getCollection } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

const SYSTEM_PROMPT = `You are a knowledgeable, friendly personal fitness coach embedded in a workout tracking app called Velon. Your role:

- Give concise, actionable fitness advice (training, nutrition, recovery, form).
- When the user asks about their workouts, reference the provided workout history data.
- Be encouraging but honest. If something looks off (e.g. too much volume, no rest days), flag it.
- Keep responses short (2-4 paragraphs max) unless the user asks for detail.
- Use plain language, no jargon without explanation.
- If you don't have enough data, say so and suggest what the user should log.
- Never give medical advice; recommend seeing a professional for injuries/health concerns.
- Format responses with markdown for readability (bold, bullet points, etc.).`;

const MODELS = ['gemini-2.5-flash-lite'] as const;
const AI_TIMEOUT_MS = 10000;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callGemini(ai: GoogleGenAI, prompt: string): Promise<string> {
  let lastError: unknown;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await Promise.race([
          ai.models.generateContent({ model, contents: prompt }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('AI request timed out')), AI_TIMEOUT_MS)),
        ]);
        return response.text ?? '';
      } catch (err: unknown) {
        lastError = err;
        const status = (err as { status?: number }).status;

        if (status === 429) {
          if (attempt === 0) {
            logger.warn(`Rate limited on ${model}, retrying in 3s...`);
            await sleep(3000);
            continue;
          }
          logger.warn(`Rate limited on ${model} after retry, trying next model...`);
          break;
        }
        throw err;
      }
    }
  }

  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json();
    const { message, includeWorkoutData } = body;

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    let workoutContext = '';
    if (includeWorkoutData) {
      workoutContext = await buildWorkoutContext(userId);
    }

    const ai = new GoogleGenAI({ apiKey });

    const userPrompt = workoutContext
      ? `${SYSTEM_PROMPT}\n\n--- USER'S RECENT WORKOUT DATA ---\n${workoutContext}\n--- END DATA ---\n\nUser message: ${message}`
      : `${SYSTEM_PROMPT}\n\nUser message: ${message}`;

    const text = await callGemini(ai, userPrompt);

    return NextResponse.json({ reply: text || 'I didn\'t get a response — please try again.' }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.error('Chat API error:', error);

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
    const sessCol = await getCollection('WorkoutSession');
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const sessions = await sessCol
      .find({ userId, date: { $gte: fourWeeksAgo } })
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
    logger.error('Failed to build workout context:', err);
    return 'Could not retrieve workout data.';
  }
}
