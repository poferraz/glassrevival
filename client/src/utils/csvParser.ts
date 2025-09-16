// CSV Parsing utilities following the specification

export interface ParsedPrescription {
  unit: 'reps' | 'seconds' | 'steps';
  repsMin: number | null;
  repsMax: number | null;
  timeSecondsMin: number | null;
  timeSecondsMax: number | null;
  stepsCount: number | null;
  perSide: boolean;
}

export interface RawExerciseData {
  Day: string;
  Exercise: string;
  Sets: number;
  'Reps/Time': string;
  Weight?: number;
  Notes?: string;
  'Form Guidance'?: string;
  'Muscle Group': string;
  'Main Muscle': string;
}

export interface ParsedExerciseData {
  id: string;
  day: string;
  dayKey: string;
  exercise: string;
  sets: number;
  prescription: ParsedPrescription;
  weight?: number;
  notes?: string;
  formGuidance?: string;
  muscleGroup: string;
  mainMuscle: string;
}

// Prescription parser following the specification rules
export function parsePrescription(raw: string | null | undefined): ParsedPrescription {
  const out: ParsedPrescription = { 
    unit: "reps", 
    repsMin: null, 
    repsMax: null, 
    timeSecondsMin: null, 
    timeSecondsMax: null, 
    stepsCount: null, 
    perSide: false 
  };
  
  if (raw == null) return out;
  
  let s = String(raw).trim().toLowerCase();
  
  // Detect per side intent
  out.perSide = /(per\s*(side|leg)|\/side|\/leg)/i.test(s);
  
  // Convert ranges to canonical form "A to B"
  s = s.replace(/(\d+)\D+(\d+)/, "$1 to $2 ");
  
  // Time in minutes
  if (/\bmin\b/.test(s)) {
    const m = s.match(/(\d+)\s*min/);
    if (m) { 
      out.unit = "seconds"; 
      out.timeSecondsMin = Number(m[1]) * 60; 
      out.timeSecondsMax = out.timeSecondsMin; 
      return out; 
    }
  }
  
  // Steps
  if (/\bsteps?\b/.test(s)) {
    const m = s.match(/(\d+)\s*steps?/);
    if (m) { 
      out.unit = "steps"; 
      out.stepsCount = Number(m[1]); 
      return out; 
    }
  }
  
  // Time in seconds
  if (/\bs\b/.test(s)) {
    const r = s.match(/(\d+)\s*to\s*(\d+)\s*s/);
    if (r) { 
      out.unit = "seconds"; 
      out.timeSecondsMin = Number(r[1]); 
      out.timeSecondsMax = Number(r[2]); 
      return out; 
    }
    const m = s.match(/(\d+)\s*s/);
    if (m) { 
      out.unit = "seconds"; 
      out.timeSecondsMin = Number(m[1]); 
      out.timeSecondsMax = Number(m[1]); 
      return out; 
    }
  }
  
  // Reps (default)
  const rr = s.match(/(\d+)\s*to\s*(\d+)/);
  if (rr) { 
    out.unit = "reps"; 
    out.repsMin = Number(rr[1]); 
    out.repsMax = Number(rr[2]); 
    return out; 
  }
  
  const r1 = s.match(/^\s*(\d+)\s*$/);
  if (r1) { 
    out.unit = "reps"; 
    out.repsMin = Number(r1[1]); 
    out.repsMax = Number(r1[1]); 
    return out; 
  }
  
  return out;
}

// Create machine-friendly key from day label
export function createDayKey(dayLabel: string): string {
  return dayLabel
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '');
}

// Create muscle group slug
export function createMuscleSlug(muscleGroup: string): string {
  return muscleGroup
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '');
}

// Mock CSV parsing function (would use Papa Parse in real implementation)
export function parseCSV(csvContent: string): {
  data: ParsedExerciseData[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    unitCounts: { reps: number; seconds: number; steps: number };
    malformedTokens: string[];
    parsingTime: number;
  };
} {
  const startTime = Date.now();
  const data: ParsedExerciseData[] = [];
  const malformedTokens: string[] = [];
  const unitCounts = { reps: 0, seconds: 0, steps: 0 };
  
  // Mock data based on specification example
  const mockRawData: RawExerciseData[] = [
    {
      Day: "Day 1 – Push",
      Exercise: "Bench Press",
      Sets: 4,
      'Reps/Time': "8-12",
      Weight: 80,
      Notes: "Focus on controlled movement\nPause at chest",
      'Form Guidance': "Keep shoulders retracted",
      'Muscle Group': "Chest + Triceps",
      'Main Muscle': "Upper Chest"
    },
    {
      Day: "Day 1 – Push", 
      Exercise: "Incline Dumbbell Press",
      Sets: 3,
      'Reps/Time': "10 to 15",
      Weight: 32.5,
      'Form Guidance': "45-degree incline",
      'Muscle Group': "Chest + Triceps",
      'Main Muscle': "Upper Chest"
    },
    {
      Day: "Day 2 – Pull",
      Exercise: "Pull-ups",
      Sets: 3,
      'Reps/Time': "8-12",
      'Muscle Group': "Back + Biceps",
      'Main Muscle': "Lats"
    },
    {
      Day: "Day 2 – Pull",
      Exercise: "Plank Hold",
      Sets: 3,
      'Reps/Time': "30-60s",
      Notes: "Hold position, breathe steadily",
      'Muscle Group': "Core",
      'Main Muscle': "Abs"
    }
  ];

  let validRows = 0;
  
  mockRawData.forEach((row, index) => {
    if (!row.Day || !row.Exercise || !row.Sets) {
      return; // Skip invalid rows
    }
    
    const prescription = parsePrescription(row['Reps/Time']);
    
    // Check if prescription parsing failed
    if (prescription.unit === 'reps' && 
        prescription.repsMin === null && 
        prescription.repsMax === null) {
      malformedTokens.push(row['Reps/Time'] || 'empty');
    }
    
    unitCounts[prescription.unit]++;
    
    const parsed: ParsedExerciseData = {
      id: `exercise-${index + 1}`,
      day: row.Day,
      dayKey: createDayKey(row.Day),
      exercise: row.Exercise,
      sets: row.Sets,
      prescription,
      weight: row.Weight,
      notes: row.Notes?.trim(),
      formGuidance: row['Form Guidance']?.trim(),
      muscleGroup: row['Muscle Group'],
      mainMuscle: row['Main Muscle']
    };
    
    data.push(parsed);
    validRows++;
  });
  
  const parsingTime = Date.now() - startTime;
  
  return {
    data,
    stats: {
      totalRows: mockRawData.length,
      validRows,
      invalidRows: mockRawData.length - validRows,
      unitCounts,
      malformedTokens,
      parsingTime
    }
  };
}