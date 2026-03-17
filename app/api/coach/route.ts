import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { runCoachEngine, type CoachInput } from '@/lib/coach-engine';
import type { WorkoutSession } from '@/app/types/workout';

/**
 * POST /api/coach
 *
 * Body: { sessionId: string, userId: string }
 *
 * 1. Fetches the target session + recent history
 * 2. Runs the deterministic coach engine → structured JSON
 * 3. Calls OpenAI to write a human-friendly summary
 * 4. Saves feedback to the session and returns it
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId, userId } = await req.json();

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'sessionId and userId required' }, { status: 400 });
    }

    // ── Fetch data ────────────────────────────────────────────────────────────

    const sessCol = await getCollection('WorkoutSession');
    const exCol = await getCollection('Exercise');
    const usersCol = await getCollection('User');

    const user = await usersCol.findOne({ email: userId });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const session = await sessCol.findOne({ _id: new ObjectId(sessionId) });
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Get last 12 weeks of history
    const twelveWeeksAgo = new Date(session.date);
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const recentSessions = await sessCol
      .find({ userId: user._id.toString(), date: { $gte: twelveWeeksAgo, $lt: session.date }, _id: { $ne: session._id } })
      .sort({ date: -1 })
      .limit(60)
      .toArray() as unknown as WorkoutSession[];

    // Build exerciseId → muscles map
    const allExIds = new Set<string>();
    for (const s of [session, ...recentSessions]) {
      for (const e of s.exercises ?? []) allExIds.add(e.exerciseId);
    }

    const exDocs = await exCol.find({ _id: { $in: [...allExIds].filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id)) } }).toArray();
    const muscleMap: Record<string, { primary: string[]; secondary: string[] }> = {};
    for (const doc of exDocs) {
      muscleMap[doc._id.toString()] = {
        primary: doc.primaryMuscles ?? [],
        secondary: doc.secondaryMuscles ?? [],
      };
    }

    // ── Run deterministic engine ──────────────────────────────────────────────

    const coachInput: CoachInput = {
      currentSession: { ...session, _id: session._id.toString() } as unknown as WorkoutSession,
      recentSessions,
      muscleMap,
    };

    const engineResult = runCoachEngine(coachInput);

    // ── AI summary layer ──────────────────────────────────────────────────────

    let summary = buildFallbackSummary(engineResult);

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        summary = await generateAISummary(apiKey, session, engineResult);
      } catch (aiErr) {
        console.error('AI summary failed, using deterministic fallback:', aiErr);
      }
    }

    const feedback = { ...engineResult, summary };

    // ── Save to session ──────────────────────────────────────────────────────

    await sessCol.updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { coachFeedback: feedback, updatedAt: new Date() } },
    );

    return NextResponse.json(feedback, { status: 200 });
  } catch (error) {
    console.error('Coach error:', error);
    return NextResponse.json({ error: 'Failed to generate coaching feedback' }, { status: 500 });
  }
}

// ─── AI Summary (Gemini) ─────────────────────────────────────────────────────

async function generateAISummary(
  apiKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  engineResult: any,
): Promise<string> {
  const systemPrompt = `You are an expert strength coach. Write concise, professional plain-text feedback. No HTML tags. No markdown symbols like # or **.

Strict format (use these exact section headers on their own line):

Session Summary

Progression
- Up to 4 bullets, one per exercise, with exact loads/reps. 

- Give your clear thoughts on progression for each exercise in a concise summary. 

Next Session Targets
- One bullet per exercise: Exercise: sets x rep-range @ load

Rules:
- Keep under 180 words.
- No repeated advice for the same exercise.
- Use plain language and exact numbers from the data.
- Do NOT include warnings, volume balance, fatigue alerts, or imbalance commentary.
- Output plain text only. No HTML, no markdown.`;

  const userPrompt = `${systemPrompt}

Session (${session.goal}, ${new Date(session.date).toLocaleDateString()}):
${JSON.stringify(session.exercises?.map((e: { exerciseName: string; sets: { weight: number; reps: number; rpe?: number; isFailure: boolean }[] }) => ({
  name: e.exerciseName,
  sets: e.sets.map(s => `${s.weight}×${s.reps}${s.rpe ? ` RPE ${s.rpe}` : ''}${s.isFailure ? ' (failure)' : ''}`),
})), null, 2)}

Coach engine analysis:
${JSON.stringify(engineResult, null, 2)}`;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: userPrompt,
  });

  const text = response.text ?? '';
  return text.trim() || buildFallbackSummary(engineResult);
}

// ─── Deterministic Fallback Summary ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFallbackSummary(result: any): string {
  const lines: string[] = [];

  type SummaryAdjustment = { exerciseName?: string; type?: string; description?: string };
  type SummaryTarget = { exerciseName?: string; targetSets?: number; targetReps?: string; targetWeight?: number; targetUnit?: string };
  type SummaryWarning = { severity?: 'high' | 'medium' | 'low'; type?: string; message?: string };
  type SummaryVolume = { suggestion?: string };

  const adjustmentPriority: Record<string, number> = {
    deload: 0,
    load_decrease: 1,
    load_increase: 2,
    rep_increase: 3,
    remove_set: 4,
    add_set: 5,
  };

  const adjustments: SummaryAdjustment[] = Array.isArray(result.progressionAdjustments)
    ? result.progressionAdjustments
    : [];
  const targets: SummaryTarget[] = Array.isArray(result.nextSessionTargets)
    ? result.nextSessionTargets
    : [];
  const warnings: SummaryWarning[] = Array.isArray(result.warnings) ? result.warnings : [];
  const volume: SummaryVolume[] = Array.isArray(result.volumeBalance) ? result.volumeBalance : [];

  // Keep a single best adjustment per exercise to avoid conflicting advice.
  const bestByExercise = new Map<string, SummaryAdjustment>();
  for (const adj of adjustments) {
    const key = String(adj.exerciseName ?? '');
    const current = bestByExercise.get(key);
    const rank = adjustmentPriority[String(adj.type)] ?? 99;
    const currentRank = current ? (adjustmentPriority[String(current.type)] ?? 99) : 99;
    if (!current || rank < currentRank) {
      bestByExercise.set(key, adj);
    }
  }

  const topAdjustments = [...bestByExercise.values()].slice(0, 4);
  // Keep for internal training/analytics usage even though we omit from user-facing summary.
  void warnings;
  void volume;

  lines.push('SESSION SUMMARY');
  lines.push('Strength session logged.');
  lines.push('');

  if (topAdjustments.length) {
    lines.push('PROGRESSION');
    for (const adj of topAdjustments) {
      lines.push(`- ${adj.exerciseName}: ${adj.description}`);
    }
    lines.push('');
  }

  if (targets.length) {
    lines.push('NEXT SESSION TARGETS');
    for (const t of targets) {
      lines.push(`- ${t.exerciseName}: ${t.targetSets} x ${t.targetReps} @ ${t.targetWeight}${t.targetUnit}`);
    }
    lines.push('');
  }

  lines.push('Execute with controlled reps and consistent form across working sets.');

  return lines.join('\n');
}
