import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getCollection } from '@/lib/mongodb';

interface ParsedSet {
  setNumber: number;
  weight: number;
  reps: number;
  unit: 'lbs' | 'kg';
  isFailure: boolean;
}

interface ParsedExercise {
  exerciseName: string;
  sets: ParsedSet[];
  notes?: string;
}

function sanitizeName(name: string): string {
  return name
    .replace(/^[-*\d.)\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSetToken(token: string, fallbackWeight: number): { reps: number; weight: number } | null {
  const clean = token.trim().replace(/[\[\]]/g, '');
  if (!clean) return null;

  // 95 x 6
  let m = clean.match(/^(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)$/);
  if (m) {
    return {
      weight: Number(m[1]),
      reps: Math.round(Number(m[2])),
    };
  }

  // 8(90) => reps(weight)
  m = clean.match(/^(\d+(?:\.\d+)?)\s*\((\d+(?:\.\d+)?)\)$/);
  if (m) {
    return {
      reps: Math.round(Number(m[1])),
      weight: Number(m[2]),
    };
  }

  // reps only (use fallback weight)
  m = clean.match(/^(\d+(?:\.\d+)?)$/);
  if (m) {
    return {
      reps: Math.round(Number(m[1])),
      weight: fallbackWeight,
    };
  }

  return null;
}

function parseLineFallback(line: string, unit: 'lbs' | 'kg'): ParsedExercise | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const withoutBullet = trimmed.replace(/^[-*]\s*/, '');
  const splitMatch = withoutBullet.match(/^(.+?)\s*(?:-|:|=>)\s*(.+)$/);

  let rawName = '';
  let setsPart = '';
  if (splitMatch) {
    rawName = splitMatch[1].trim();
    setsPart = splitMatch[2].trim();
  } else {
    // If no separator, treat the whole line as name and create one empty set
    const fallbackName = sanitizeName(withoutBullet);
    if (!fallbackName) return null;
    return {
      exerciseName: fallbackName,
      sets: [{ setNumber: 1, weight: 0, reps: 0, unit, isFailure: false }],
    };
  }

  const nameWeightMatch = rawName.match(/^(.+?)\s*\((\d+(?:\.\d+)?)\)\s*$/);
  let exerciseName = sanitizeName(rawName);
  let fallbackWeight = 0;

  if (nameWeightMatch) {
    exerciseName = sanitizeName(nameWeightMatch[1]);
    fallbackWeight = Number(nameWeightMatch[2]);
  }

  if (!exerciseName) return null;

  const normalizedSetsPart = setsPart.replace(/^[\[]|[\]]$/g, '');
  const tokens = normalizedSetsPart
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const sets = tokens
    .map(token => parseSetToken(token, fallbackWeight))
    .filter((v): v is { reps: number; weight: number } => v !== null)
    .map((parsed, idx) => ({
      setNumber: idx + 1,
      weight: Number.isFinite(parsed.weight) ? parsed.weight : 0,
      reps: Number.isFinite(parsed.reps) ? parsed.reps : 0,
      unit,
      isFailure: false,
    }));

  if (!sets.length) {
    sets.push({ setNumber: 1, weight: fallbackWeight, reps: 0, unit, isFailure: false });
  }

  return { exerciseName, sets };
}

function parseFallback(rawText: string, unit: 'lbs' | 'kg'): ParsedExercise[] {
  return rawText
    .split(/\r?\n/)
    .map(line => parseLineFallback(line, unit))
    .filter((item): item is ParsedExercise => item !== null);
}

async function parseWithAI(rawText: string, unit: 'lbs' | 'kg'): Promise<ParsedExercise[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a workout parser. Convert the user's raw workout lines into strict JSON.

Return ONLY JSON matching this shape:
{
  "exercises": [
    {
      "exerciseName": "string",
      "sets": [
        { "setNumber": 1, "weight": 95, "reps": 6, "unit": "${unit}", "isFailure": false }
      ]
    }
  ]
}

Rules:
- One exercise per line.
- Support patterns like:
  - "Barbell Chest Press - 65 x 5, 95 x 4"
  - "Chest Flyes - 8(90), 9(85)" where format is reps(weight)
  - "Lateral Raises (25) - 10,9,8" where number in name parentheses is fallback weight
  - "Triceps Extensions: [65 x 9, 60 x 10]"
- If only reps are provided, use fallback weight if present, else 0.
- Keep setNumber sequential from 1.
- Use unit "${unit}" for every set.
- Use isFailure false for every set.
- No markdown, no explanation, JSON only.

User input:
${rawText}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
  });

  const text = response.text?.trim();
  if (!text) return null;

  const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

  const parsed = JSON.parse(clean) as { exercises?: ParsedExercise[] };
  const exercises = Array.isArray(parsed.exercises) ? parsed.exercises : [];

  const normalized: ParsedExercise[] = exercises
    .map(ex => ({
      exerciseName: sanitizeName(ex.exerciseName || ''),
      sets: (ex.sets || []).map((set, idx) => ({
        setNumber: idx + 1,
        weight: Number(set.weight) || 0,
        reps: Math.max(0, Math.round(Number(set.reps) || 0)),
        unit,
        isFailure: false,
      })),
      notes: ex.notes,
    }))
    .filter(ex => ex.exerciseName && ex.sets.length > 0);

  return normalized.length ? normalized : null;
}

async function mapExerciseIds(userId: string | undefined, exercises: ParsedExercise[]) {
  const exCol = await getCollection('Exercise');

  const withIds = await Promise.all(exercises.map(async (ex) => {
    const escaped = ex.exerciseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactRegex = new RegExp(`^${escaped}$`, 'i');

    const doc = await exCol.findOne({
      $or: [
        { name: exactRegex },
        { aliases: { $in: [exactRegex] } },
      ],
    });

    return {
      exerciseId: doc?._id?.toString() || `custom:${ex.exerciseName.toLowerCase().replace(/\s+/g, '-')}`,
      exerciseName: ex.exerciseName,
      notes: ex.notes,
      sets: ex.sets,
    };
  }));

  // userId currently accepted for future custom-exercise lookup logic
  void userId;

  return withIds;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawInput = String(body?.rawInput || '').trim();
    const unit = body?.unit === 'kg' ? 'kg' : 'lbs';
    const userId = typeof body?.userId === 'string' ? body.userId : undefined;

    if (!rawInput) {
      return NextResponse.json({ error: 'rawInput is required' }, { status: 400 });
    }

    let parsed = await parseWithAI(rawInput, unit);
    let source: 'ai' | 'fallback' = 'ai';

    if (!parsed?.length) {
      parsed = parseFallback(rawInput, unit);
      source = 'fallback';
    }

    if (!parsed.length) {
      return NextResponse.json({ error: 'Unable to parse exercise input' }, { status: 422 });
    }

    const exercises = await mapExerciseIds(userId, parsed);

    return NextResponse.json({ exercises, source }, { status: 200 });
  } catch (error) {
    console.error('Error parsing workout text:', error);
    return NextResponse.json({ error: 'Failed to parse workout text' }, { status: 500 });
  }
}
