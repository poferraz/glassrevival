import WorkoutDayNav from '../WorkoutDayNav';

export default function WorkoutDayNavExample() {
  const mockDays = [
    { id: '1', label: 'Day 1 - Push', machineKey: 'day_1_push', exerciseCount: 6 },
    { id: '2', label: 'Day 2 - Pull', machineKey: 'day_2_pull', exerciseCount: 5 },
    { id: '3', label: 'Day 3 - Legs', machineKey: 'day_3_legs', exerciseCount: 7 },
    { id: '4', label: 'Day 4 - Arms', machineKey: 'day_4_arms', exerciseCount: 4 },
  ];

  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-700 min-h-screen p-4">
      <WorkoutDayNav 
        days={mockDays}
        activeDayId="1"
        onDaySelect={(dayId) => console.log('Day selected:', dayId)}
      />
    </div>
  );
}