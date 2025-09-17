import { useState, useCallback } from "react";
import { SetRow } from "./SetRow";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import GlassCard from "./GlassCard";

interface SetData {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

interface SetListProps {
  // Static sample data for now
}

export default function SetList({}: SetListProps) {
  // Static sample data with 4 sets to test layout
  const [sets, setSets] = useState<SetData[]>([
    { id: '1', reps: 12, weight: 50, completed: true },
    { id: '2', reps: 10, weight: 52.5, completed: true },
    { id: '3', reps: 8, weight: 55, completed: false },
    { id: '4', reps: 8, weight: 55, completed: false }
  ]);

  const handleSetChange = useCallback((id: string, data: { reps: number; weight: number }) => {
    setSets(prev => prev.map(set => 
      set.id === id ? { ...set, ...data } : set
    ));
  }, []);

  const handleToggleComplete = useCallback((id: string) => {
    setSets(prev => prev.map(set => 
      set.id === id ? { ...set, completed: !set.completed } : set
    ));
  }, []);

  const handleRemoveSet = useCallback((id: string) => {
    setSets(prev => prev.filter(set => set.id !== id));
  }, []);

  const handleAddSet = useCallback(() => {
    const lastSet = sets[sets.length - 1];
    const newSet: SetData = {
      id: Date.now().toString(),
      reps: lastSet?.reps || 8,
      weight: lastSet?.weight || 50,
      completed: false
    };
    setSets(prev => [...prev, newSet]);
  }, [sets]);

  return (
    <GlassCard variant="tertiary" className="overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-4 text-center">
          Set Progress
        </h3>
        
        {/* Sets Container with max height for mobile viewport */}
        <div className="set-list-container space-y-3 mb-4">
          {sets.map((set, index) => (
            <SetRow
              key={set.id}
              index={index + 1}
              reps={set.reps}
              weight={set.weight}
              completed={set.completed}
              onChange={(data) => handleSetChange(set.id, data)}
              onToggleComplete={() => handleToggleComplete(set.id)}
              onRemove={() => handleRemoveSet(set.id)}
            />
          ))}
        </div>

        {/* Add Set Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddSet}
          className="w-full text-white border-white/20 hover:bg-white/10"
          data-testid="button-add-set"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Set
        </Button>
      </div>
    </GlassCard>
  );
}