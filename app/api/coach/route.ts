import { NextRequest, NextResponse } from 'next/server';
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

    const apiKey = process.env.OPENAI_API_KEY;
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

// ─── AI Summary (OpenAI) ──────────────────────────────────────────────────────

async function generateAISummary(
  apiKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  engineResult: any,
): Promise<string> {
  const systemPrompt = `You are an expert strength & conditioning coach. Given a workout session log and structured analysis data, write a concise, encouraging coaching summary (3-6 paragraphs). Include:
1. Session overview (what was done, overall performance)
2. Specific progression recommendations with exact numbers
3. Volume/balance observations
4. Any warnings about fatigue, failure patterns, or imbalances
5. Motivational closing

Reference the athlete's actual numbers. Be specific, not generic. Use plain language.`;

  const userPrompt = `Session (${session.goal}, ${new Date(session.date).toLocaleDateString()}):
${JSON.stringify(session.exercises?.map((e: { exerciseName: string; sets: { weight: number; reps: number; rpe?: number; isFailure: boolean }[] }) => ({
  name: e.exerciseName,
  sets: e.sets.map(s => `${s.weight}×${s.reps}${s.rpe ? ` RPE ${s.rpe}` : ''}${s.isFailure ? ' (failure)' : ''}`),
})), null, 2)}

Coach engine analysis:
${JSON.stringify(engineResult, null, 2)}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? buildFallbackSummary(engineResult);
}

// ─── Deterministic Fallback Summary ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFallbackSummary(result: any): string {
  const lines: string[] = [];

  lines.push('## Session Analysis\n');

  if (result.progressionAdjustments?.length) {
    lines.push('**Progression:**');
    for (const adj of result.progressionAdjustments) {
      lines.push(`- ${adj.exerciseName}: ${adj.description}`);
    }
    lines.push('');
  }

  if (result.nextSessionTargets?.length) {
    lines.push('**Next Session Targets:**');
    for (const t of result.nextSessionTargets) {
      lines.push(`- ${t.exerciseName}: ${t.targetSets} sets × ${t.targetReps} reps @ ${t.targetWeight}${t.targetUnit}${t.notes ? ` (${t.notes})` : ''}`);
    }
    lines.push('');
  }

  if (result.warnings?.length) {
    lines.push('**Warnings:**');
    for (const w of result.warnings) {
      const icon = w.severity === 'high' ? '🔴' : w.severity === 'medium' ? '🟡' : '🟢';
      lines.push(`- ${icon} ${w.message}`);
    }
    lines.push('');
  }

  if (result.volumeBalance?.length) {
    lines.push('**Volume Balance:**');
    for (const v of result.volumeBalance) {
      if (v.suggestion) lines.push(`- ${v.muscleGroup}: ${v.suggestion}`);
    }
  }

  if (!lines.length) lines.push('Session looks solid — keep up the good work!');

  return lines.join('\n');
}
