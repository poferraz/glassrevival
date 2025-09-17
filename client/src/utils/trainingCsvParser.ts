import { SessionTemplate, SessionExercise } from "@shared/schema";
import { generateUniqueId, estimateSessionDuration } from "./workoutHelpers";

export interface ParsedTrainingCSV {
  sessions: SessionTemplate[];
  errors: string[];
}

export interface CSVRow {
  Day: string;
  Exercise: string;
  Sets: string;
  'Reps/Time': string;
  Weight: string;
  Notes: string;
  'Form Guidance': string;
  'Muscle Group': string;
  'Main Muscle': string;
}

/**
 * Parse the training CSV file and convert to session templates
 * Groups exercises by Day column, preserving order within each day
 */
export function parseTrainingCSV(csvContent: string): ParsedTrainingCSV {
  const errors: string[] = [];
  const sessions: SessionTemplate[] = [];
  
  try {
    // Parse CSV content
    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length < 2) {
      errors.push('CSV file must have at least a header and one data row');
      return { sessions, errors };
    }

    // Parse header
    const header = lines[0].split(',').map(col => col.trim());
    const expectedColumns = ['Day', 'Exercise', 'Sets', 'Reps/Time', 'Weight', 'Notes', 'Form Guidance', 'Muscle Group', 'Main Muscle'];
    
    // Validate header columns
    for (const expectedCol of expectedColumns) {
      if (!header.includes(expectedCol)) {
        errors.push(`Missing required column: ${expectedCol}`);
      }
    }
    
    if (errors.length > 0) {
      return { sessions, errors };
    }

    // Parse data rows
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length !== header.length) {
        errors.push(`Row ${i + 1}: Expected ${header.length} columns, got ${values.length}`);
        continue;
      }
      
      const row: any = {};
      header.forEach((col, index) => {
        row[col] = values[index].trim();
      });
      rows.push(row as CSVRow);
    }

    // Group exercises by Day
    const dayGroups = new Map<string, CSVRow[]>();
    rows.forEach(row => {
      if (!row.Day) {
        errors.push(`Row with exercise "${row.Exercise}" has no Day specified`);
        return;
      }
      
      if (!dayGroups.has(row.Day)) {
        dayGroups.set(row.Day, []);
      }
      dayGroups.get(row.Day)!.push(row);
    });

    // Convert each day group to a session template
    dayGroups.forEach((exercises, dayName) => {
      try {
        const sessionTemplate = convertDayToSessionTemplate(dayName, exercises);
        sessions.push(sessionTemplate);
      } catch (error) {
        errors.push(`Error processing ${dayName}: ${error}`);
      }
    });

  } catch (error) {
    errors.push(`Failed to parse CSV: ${error}`);
  }

  return { sessions, errors };
}

/**
 * Parse a CSV line handling quoted values and commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Convert a day's exercises to a SessionTemplate
 */
function convertDayToSessionTemplate(dayName: string, exercises: CSVRow[]): SessionTemplate {
  const sessionExercises: SessionExercise[] = [];
  
  exercises.forEach((row, index) => {
    try {
      const exercise = convertRowToSessionExercise(row, index);
      sessionExercises.push(exercise);
    } catch (error) {
      throw new Error(`Exercise "${row.Exercise}": ${error}`);
    }
  });
  
  // Extract tags from day name
  const tags = extractTagsFromDayName(dayName);
  
  const template: SessionTemplate = {
    id: generateUniqueId(),
    name: dayName,
    description: `${sessionExercises.length} exercises targeting ${tags.join(', ').toLowerCase()}`,
    exercises: sessionExercises,
    estimatedDurationMinutes: estimateSessionDuration(sessionExercises),
    tags: tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return template;
}

/**
 * Convert a CSV row to a SessionExercise
 */
function convertRowToSessionExercise(row: CSVRow, order: number): SessionExercise {
  // Parse sets
  const sets = parseInt(row.Sets);
  if (isNaN(sets) || sets < 1) {
    throw new Error(`Invalid sets value: "${row.Sets}"`);
  }
  
  // Parse reps/time prescription
  const { unit, repsMin, repsMax, timeSecondsMin, timeSecondsMax, stepsCount, perSide } = parseRepsTime(row['Reps/Time']);
  
  // Parse weight (optional)
  let weight: number | undefined;
  if (row.Weight && row.Weight.trim()) {
    const weightMatch = row.Weight.match(/(\d+(?:\.\d+)?)/);
    if (weightMatch) {
      weight = parseFloat(weightMatch[1]);
    }
  }
  
  // Calculate rest time based on exercise type (basic heuristic)
  const restSeconds = calculateRestTime(row['Muscle Group'], sets);
  
  const exercise: SessionExercise = {
    id: generateUniqueId(),
    name: row.Exercise,
    sets,
    repsMin,
    repsMax,
    timeSecondsMin,
    timeSecondsMax,
    stepsCount,
    unit,
    perSide,
    weight,
    notes: row.Notes || undefined,
    formGuidance: row['Form Guidance'] || undefined,
    muscleGroup: row['Muscle Group'],
    mainMuscle: row['Main Muscle'],
    restSeconds
  };
  
  return exercise;
}

/**
 * Parse the Reps/Time column to determine exercise prescription
 */
function parseRepsTime(repsTimeStr: string): {
  unit: 'reps' | 'seconds' | 'steps';
  repsMin?: number;
  repsMax?: number;
  timeSecondsMin?: number;
  timeSecondsMax?: number;
  stepsCount?: number;
  perSide: boolean;
} {
  const str = repsTimeStr.trim().toLowerCase();
  
  // Check for per-side indicators
  const perSide = /\/side|\/leg|per side|per leg|each side|each leg/i.test(str);
  
  // Clean the string for parsing
  const cleanStr = str.replace(/\/side|\/leg|per side|per leg|each side|each leg/gi, '').trim();
  
  // Check for time-based units
  if (/\d+\s*s\b|seconds?|min|minutes?/.test(cleanStr)) {
    const timeMatch = cleanStr.match(/(\d+)(?:-(\d+))?\s*(?:s\b|seconds?|min|minutes?)/);
    if (timeMatch) {
      const minTime = parseInt(timeMatch[1]);
      const maxTime = timeMatch[2] ? parseInt(timeMatch[2]) : minTime;
      
      // Convert minutes to seconds
      const minSeconds = cleanStr.includes('min') ? minTime * 60 : minTime;
      const maxSeconds = cleanStr.includes('min') ? maxTime * 60 : maxTime;
      
      return {
        unit: 'seconds',
        timeSecondsMin: minSeconds,
        timeSecondsMax: maxSeconds,
        perSide
      };
    }
  }
  
  // Check for steps
  if (/steps?/.test(cleanStr)) {
    const stepsMatch = cleanStr.match(/(\d+)\s*steps?/);
    if (stepsMatch) {
      return {
        unit: 'steps',
        stepsCount: parseInt(stepsMatch[1]),
        perSide
      };
    }
  }
  
  // Default to reps - parse ranges like "10-12" or single values like "15"
  const repsMatch = cleanStr.match(/(\d+)(?:-(\d+))?/);
  if (repsMatch) {
    const minReps = parseInt(repsMatch[1]);
    const maxReps = repsMatch[2] ? parseInt(repsMatch[2]) : minReps;
    
    return {
      unit: 'reps',
      repsMin: minReps,
      repsMax: maxReps,
      perSide
    };
  }
  
  // Fallback - treat as single rep value
  const fallbackMatch = str.match(/\d+/);
  if (fallbackMatch) {
    const reps = parseInt(fallbackMatch[0]);
    return {
      unit: 'reps',
      repsMin: reps,
      repsMax: reps,
      perSide
    };
  }
  
  throw new Error(`Unable to parse reps/time: "${repsTimeStr}"`);
}

/**
 * Extract meaningful tags from day name
 */
function extractTagsFromDayName(dayName: string): string[] {
  const tags: string[] = [];
  const lowerName = dayName.toLowerCase();
  
  // Extract main muscle groups
  if (lowerName.includes('push')) tags.push('Push');
  if (lowerName.includes('pull')) tags.push('Pull');
  if (lowerName.includes('legs')) tags.push('Legs');
  if (lowerName.includes('shoulders')) tags.push('Shoulders');
  if (lowerName.includes('abs')) tags.push('Abs');
  if (lowerName.includes('cardio')) tags.push('Cardio');
  if (lowerName.includes('arms')) tags.push('Arms');
  
  // Add training type tags
  if (lowerName.includes('cardio')) tags.push('Conditioning');
  if (lowerName.includes('strength') || lowerName.includes('power')) tags.push('Strength');
  
  return tags.length > 0 ? tags : ['General'];
}

/**
 * Calculate appropriate rest time based on muscle group and intensity
 */
function calculateRestTime(muscleGroup: string, sets: number): number {
  const group = muscleGroup.toLowerCase();
  
  // Longer rest for compound movements and heavy lifting
  if (group.includes('chest') || group.includes('back') || group.includes('legs')) {
    return sets >= 4 ? 180 : 120; // 2-3 minutes
  }
  
  // Medium rest for isolation work
  if (group.includes('shoulders') || group.includes('triceps') || group.includes('biceps')) {
    return 90; // 1.5 minutes
  }
  
  // Shorter rest for cardio and conditioning
  if (group.includes('conditioning') || group.includes('cardio') || group.includes('core')) {
    return 60; // 1 minute
  }
  
  // Default rest time
  return 90;
}