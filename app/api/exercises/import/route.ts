import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { parseCSV } from '@/lib/csv';
import { getAuthUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import type { MovementPattern, EquipmentType, MuscleGroup, Difficulty } from '@/app/types/workout';

const BODY_PART_MAP: Record<string, MuscleGroup[]> = {
  'chest':        ['chest'],
  'shoulders':    ['front_delts', 'side_delts'],
  'middle back':  ['upper_back', 'lats'],
  'lower back':   ['lower_back'],
  'back':         ['upper_back', 'lats'],
  'upper back':   ['upper_back', 'traps'],
  'lats':         ['lats'],
  'traps':        ['traps'],
  'neck':         ['traps'],
  'biceps':       ['biceps'],
  'triceps':      ['triceps'],
  'forearms':     ['forearms'],
  'quadriceps':   ['quads'],
  'quads':        ['quads'],
  'hamstrings':   ['hamstrings'],
  'glutes':       ['glutes'],
  'calves':       ['calves'],
  'abdominals':   ['abs'],
  'abs':          ['abs'],
  'core':         ['abs', 'obliques'],
  'adductors':    ['hip_flexors'],
  'abductors':    ['glutes'],
  'hip flexors':  ['hip_flexors'],
  'obliques':     ['obliques'],
  'full body':    ['chest', 'quads', 'upper_back'],
  'cardio':       ['quads', 'hamstrings'],
  'legs':         ['quads', 'hamstrings', 'glutes'],
};

const EQUIPMENT_MAP: Record<string, EquipmentType> = {
  'barbell':            'barbell',
  'dumbbell':           'dumbbell',
  'machine':            'machine',
  'cable':              'cable',
  'body only':          'bodyweight',
  'body weight':        'bodyweight',
  'bodyweight':         'bodyweight',
  'kettlebells':        'kettlebell',
  'kettlebell':         'kettlebell',
  'bands':              'band',
  'band':               'band',
  'e-z curl bar':       'ez_bar',
  'ez curl bar':        'ez_bar',
  'exercise ball':      'bodyweight',
  'stability ball':     'bodyweight',
  'foam roll':          'bodyweight',
  'medicine ball':      'bodyweight',
  'pull-up bar':        'bodyweight',
  'pullup bar':         'bodyweight',
  'smith machine':      'smith_machine',
  'trap bar':           'trap_bar',
  'other':              'bodyweight',
  'none':               'bodyweight',
  '':                   'bodyweight',
};

const LEVEL_MAP: Record<string, Difficulty> = {
  'beginner':     'beginner',
  'intermediate': 'intermediate',
  'expert':       'advanced',
};

const TYPE_PATTERN_MAP: Record<string, MovementPattern> = {
  'strength':              'push',
  'powerlifting':          'push',
  'olympic weightlifting': 'push',
  'strongman':             'carry',
  'plyometrics':           'push',
  'stretching':            'isolation',
  'cardio':                'core',
};

function inferPattern(bodyPart: string, type: string): MovementPattern {
  const bp = bodyPart.toLowerCase();
  if (['lower back', 'hamstrings', 'glutes'].includes(bp)) return 'hinge';
  if (bp === 'quadriceps') return 'squat';
  if (['lats', 'middle back', 'biceps', 'forearms', 'traps'].includes(bp)) return 'pull';
  if (['chest', 'shoulders', 'triceps'].includes(bp)) return 'push';
  if (['abdominals', 'adductors', 'abductors'].includes(bp)) return 'core';
  return TYPE_PATTERN_MAP[type.toLowerCase()] ?? 'isolation';
}

export async function POST(req: NextRequest) {
  try {
    getAuthUser(req);
    let csvText: string;
    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      csvText = await file.text();
    } else {
      const body = await req.json();
      csvText = body.csv;
    }

    if (!csvText?.trim()) {
      return NextResponse.json({ error: 'Empty CSV' }, { status: 400 });
    }

    const rawRows = parseCSV(csvText);
    if (!rawRows.length) {
      return NextResponse.json({ error: 'No data rows found' }, { status: 400 });
    }

    const rows = rawRows.map(r => {
      const normalized: Record<string, string> = {};
      for (const [k, v] of Object.entries(r)) {
        normalized[k.toLowerCase().trim()] = v;
      }
      return normalized;
    });

    const col = await getCollection('Exercise');
    const now = new Date();
    const errors: { row: number; message: string }[] = [];
    const docs: Record<string, unknown>[] = [];
    const unmappedBodyParts = new Set<string>();
    const unmappedEquipment = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2;

      const name = (r['title'] ?? r['name'])?.trim();
      if (!name) {
        errors.push({ row: rowNum, message: `Missing Title. Keys: ${Object.keys(r).join(', ')}` });
        continue;
      }

      const rawBodyPart = (r['bodypart'] ?? r['body part'] ?? '').trim().toLowerCase();
      const primaryMuscles = BODY_PART_MAP[rawBodyPart] ?? ['chest'];
      if (!BODY_PART_MAP[rawBodyPart]) unmappedBodyParts.add(rawBodyPart || '(empty)');

      const rawEquipment = (r['equipment'] ?? '').trim().toLowerCase();
      const mappedEquip = EQUIPMENT_MAP[rawEquipment] ?? 'bodyweight';
      if (!(rawEquipment in EQUIPMENT_MAP)) unmappedEquipment.add(rawEquipment || '(empty)');

      const rawLevel = (r['level'] ?? 'beginner').trim().toLowerCase();
      const difficulty = LEVEL_MAP[rawLevel] ?? 'beginner';

      const rawType = (r['type'] ?? '').trim();
      const category = rawType.toLowerCase() || 'strength';
      const movementPattern = inferPattern(rawBodyPart, rawType);

      const instructions = (r['description'] ?? r['desc'] ?? '').trim();
      const rating = parseFloat(r['rating'] ?? '0') || 0;

      docs.push({
        name,
        aliases: [],
        primaryMuscles,
        secondaryMuscles: [],
        movementPattern,
        equipment: [mappedEquip],
        defaultRepRange: { min: 8, max: 12 },
        difficulty,
        category,
        instructions,
        isCustom: false,
        variations: [],
        rating,
        createdAt: now,
        updatedAt: now,
      });
    }

    let inserted = 0;
    let skippedDuplicates = 0;

    if (docs.length) {
      // Use distinct instead of loading all docs into memory
      const existingNames = await col.distinct('name', { isCustom: false });
      const existingNameSet = new Set(existingNames.map(n => n.toLowerCase()));

      const toInsert = docs.filter(d => {
        const key = (d.name as string).toLowerCase();
        if (existingNameSet.has(key)) {
          skippedDuplicates++;
          return false;
        }
        existingNameSet.add(key);
        return true;
      });

      if (toInsert.length) {
        const result = await col.insertMany(toInsert);
        inserted = result.insertedCount;
      }
    }

    return NextResponse.json({
      success: true,
      imported: inserted,
      skippedDuplicates,
      errors: errors.length ? errors.slice(0, 20) : undefined,
      unmappedBodyParts: unmappedBodyParts.size ? [...unmappedBodyParts] : undefined,
      unmappedEquipment: unmappedEquipment.size ? [...unmappedEquipment] : undefined,
      totalRows: rows.length,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('CSV import error:', error);
    return NextResponse.json({ error: 'Failed to import CSV' }, { status: 500 });
  }
}
