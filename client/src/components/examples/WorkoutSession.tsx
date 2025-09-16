import WorkoutSession from '../WorkoutSession';
import { Exercise } from '../ExerciseCard';

export default function WorkoutSessionExample() {
  const mockExercises: Exercise[] = [
    {
      id: '1',
      name: 'Bench Press',
      sets: 4,
      repsMin: 8,
      repsMax: 12,
      unit: 'reps',
      perSide: false,
      weight: 80,
      notes: 'Focus on controlled movement',
      formGuidance: 'Keep shoulders retracted and feet flat on floor',
      muscleGroup: 'Chest + Triceps',
      mainMuscle: 'Upper Chest'
    },
    {
      id: '2',
      name: 'Incline Dumbbell Press', 
      sets: 3,
      repsMin: 10,
      repsMax: 15,
      unit: 'reps',
      perSide: false,
      weight: 32.5,
      formGuidance: '45-degree incline, control the weight',
      muscleGroup: 'Chest + Triceps',
      mainMuscle: 'Upper Chest'
    },
    {
      id: '3',
      name: 'Push-ups',
      sets: 3,
      repsMin: 15,
      repsMax: 20,
      unit: 'reps', 
      perSide: false,
      notes: 'If too easy, elevate feet',
      formGuidance: 'Full range of motion, chest to floor',
      muscleGroup: 'Chest + Triceps',
      mainMuscle: 'Chest'
    },
    {
      id: '4',
      name: 'Tricep Dips',
      sets: 2,
      repsMin: 12,
      repsMax: 15,
      unit: 'reps',
      perSide: false,
      formGuidance: 'Keep elbows close to body, controlled movement',
      muscleGroup: 'Triceps',
      mainMuscle: 'Triceps'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-700 min-h-screen p-4">
      <WorkoutSession
        dayLabel="Day 1 - Push"
        exercises={mockExercises}
        onExerciseComplete={(id) => console.log('Exercise completed:', id)}
        onSessionComplete={() => console.log('Session completed!')}
      />
    </div>
  );
}