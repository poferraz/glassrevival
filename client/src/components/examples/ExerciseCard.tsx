import ExerciseCard, { Exercise } from '../ExerciseCard';

export default function ExerciseCardExample() {
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
      notes: 'Focus on controlled movement\nPause at chest for 1 second',
      formGuidance: 'Keep shoulders retracted and feet flat on floor',
      muscleGroup: 'Chest + Triceps',
      mainMuscle: 'Upper Chest'
    },
    {
      id: '2', 
      name: 'Plank Hold',
      sets: 3,
      timeSecondsMin: 30,
      timeSecondsMax: 60,
      unit: 'seconds',
      perSide: false,
      notes: 'Hold position, breathe steadily',
      formGuidance: 'Keep core tight, straight line from head to heels',
      muscleGroup: 'Core',
      mainMuscle: 'Abs'
    },
    {
      id: '3',
      name: 'Bulgarian Split Squats',
      sets: 3,
      repsMin: 12,
      repsMax: 15,
      unit: 'reps',
      perSide: true,
      weight: 25,
      formGuidance: 'Keep front knee over ankle, control the descent',
      muscleGroup: 'Legs',
      mainMuscle: 'Quadriceps'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-700 min-h-screen p-4 space-y-6">
      {mockExercises.map((exercise) => (
        <ExerciseCard 
          key={exercise.id}
          exercise={exercise}
          onComplete={(id) => console.log(`Completed exercise: ${id}`)}
        />
      ))}
    </div>
  );
}