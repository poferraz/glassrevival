import { useState } from "react";
import { cn } from "@/lib/utils";
import GlassCard from "./GlassCard";

interface WorkoutDay {
  id: string;
  label: string;
  machineKey: string;
  exerciseCount: number;
}

interface WorkoutDayNavProps {
  days: WorkoutDay[];
  activeDayId?: string;
  onDaySelect?: (dayId: string) => void;
}

export default function WorkoutDayNav({ 
  days, 
  activeDayId, 
  onDaySelect 
}: WorkoutDayNavProps) {
  const [selectedDay, setSelectedDay] = useState(activeDayId || days[0]?.id);

  const handleDaySelect = (dayId: string) => {
    setSelectedDay(dayId);
    onDaySelect?.(dayId);
    console.log(`Selected workout day: ${dayId}`);
  };

  return (
    <div className="sticky top-4 z-20" data-testid="workout-day-nav">
      <GlassCard variant="secondary" className="p-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => handleDaySelect(day.id)}
              className={cn(
                "flex-shrink-0 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200",
                "min-w-[120px] text-center border border-transparent",
                selectedDay === day.id
                  ? "bg-primary text-primary-foreground shadow-md transform scale-105"
                  : "text-white/90 hover-elevate active-elevate-2 hover:text-white"
              )}
              data-testid={`day-button-${day.id}`}
            >
              <div>
                <div className="font-semibold">{day.label}</div>
                <div className="text-xs opacity-75">
                  {day.exerciseCount} exercises
                </div>
              </div>
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}