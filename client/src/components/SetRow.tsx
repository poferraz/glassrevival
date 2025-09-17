import { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  Circle, 
  Plus, 
  Minus, 
  MoreHorizontal,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SetRowProps {
  index: number;
  reps: number;
  weight: number;
  completed: boolean;
  onChange: (data: { reps: number; weight: number }) => void;
  onToggleComplete: () => void;
  onRemove: () => void;
}

interface EditState {
  isEditing: 'reps' | 'weight' | null;
  reps: number;
  weight: number;
}

export const SetRow = memo(function SetRow({
  index,
  reps,
  weight,
  completed,
  onChange,
  onToggleComplete,
  onRemove
}: SetRowProps) {
  const [editState, setEditState] = useState<EditState>({
    isEditing: null,
    reps,
    weight
  });

  const startEditing = useCallback((field: 'reps' | 'weight') => {
    setEditState({
      isEditing: field,
      reps,
      weight
    });
  }, [reps, weight]);

  const finishEditing = useCallback(() => {
    onChange({
      reps: editState.reps,
      weight: editState.weight
    });
    setEditState(prev => ({
      ...prev,
      isEditing: null
    }));
  }, [editState.reps, editState.weight, onChange]);

  const updateEditValue = useCallback((field: 'reps' | 'weight', value: number) => {
    setEditState(prev => ({
      ...prev,
      [field]: Math.max(0, value)
    }));
  }, []);

  const incrementValue = useCallback((field: 'reps' | 'weight') => {
    const increment = field === 'weight' ? 2.5 : 1;
    updateEditValue(field, editState[field] + increment);
  }, [editState, updateEditValue]);

  const decrementValue = useCallback((field: 'reps' | 'weight') => {
    const decrement = field === 'weight' ? 2.5 : 1;
    updateEditValue(field, editState[field] - decrement);
  }, [editState, updateEditValue]);

  const handleRemoveClick = useCallback(() => {
    if (confirm(`Remove Set ${index}?`)) {
      onRemove();
    }
  }, [index, onRemove]);

  const currentReps = editState.isEditing === 'reps' ? editState.reps : reps;
  const currentWeight = editState.isEditing === 'weight' ? editState.weight : weight;

  return (
    <div className="fixed-row-height bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
      <div className="flex items-center justify-between h-full">
        {/* Completion Toggle */}
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleComplete}
          className="shrink-0 text-white hover:bg-white/10"
          aria-label={`${completed ? 'Mark incomplete' : 'Mark complete'} set ${index}`}
          data-testid={`button-toggle-complete-${index}`}
        >
          {completed ? (
            <CheckCircle className="w-6 h-6 text-green-400" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </Button>

        {/* Set Index */}
        <div className="text-lg font-semibold text-white min-w-[3rem] text-center" data-testid={`text-set-index-${index}`}>
          Set {index}
        </div>

        {/* Reps Display/Edit */}
        <div className="flex-1 min-w-0 mx-4">
          {editState.isEditing === 'reps' ? (
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => decrementValue('reps')}
                className="text-white border-white/20 hover:bg-white/10 shrink-0 h-8 w-8"
                data-testid={`button-decrement-reps-${index}`}
              >
                <Minus className="w-3 h-3" />
              </Button>
              
              <Input
                type="number"
                inputMode="numeric"
                value={currentReps}
                onChange={(e) => updateEditValue('reps', parseInt(e.target.value) || 0)}
                onBlur={finishEditing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    finishEditing();
                  }
                }}
                className="text-center text-lg font-semibold bg-white/10 border-white/20 text-white h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
                data-testid={`input-reps-${index}`}
              />
              
              <Button
                size="icon"
                variant="outline"
                onClick={() => incrementValue('reps')}
                className="text-white border-white/20 hover:bg-white/10 shrink-0 h-8 w-8"
                data-testid={`button-increment-reps-${index}`}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => startEditing('reps')}
              className="text-lg font-bold text-white hover:text-blue-300 transition-colors w-full text-center min-h-[2rem] flex items-center justify-center"
              aria-label={`Edit reps for set ${index}, currently ${currentReps}`}
              data-testid={`button-edit-reps-${index}`}
            >
              {currentReps} reps
            </button>
          )}
        </div>

        {/* Weight Display/Edit */}
        <div className="flex-1 min-w-0 mx-4">
          {editState.isEditing === 'weight' ? (
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => decrementValue('weight')}
                className="text-white border-white/20 hover:bg-white/10 shrink-0 h-8 w-8"
                data-testid={`button-decrement-weight-${index}`}
              >
                <Minus className="w-3 h-3" />
              </Button>
              
              <Input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={currentWeight}
                onChange={(e) => updateEditValue('weight', parseFloat(e.target.value) || 0)}
                onBlur={finishEditing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    finishEditing();
                  }
                }}
                className="text-center text-lg font-semibold bg-white/10 border-white/20 text-white h-8"
                autoFocus
                data-testid={`input-weight-${index}`}
              />
              
              <Button
                size="icon"
                variant="outline"
                onClick={() => incrementValue('weight')}
                className="text-white border-white/20 hover:bg-white/10 shrink-0 h-8 w-8"
                data-testid={`button-increment-weight-${index}`}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => startEditing('weight')}
              className="text-lg font-bold text-white hover:text-blue-300 transition-colors w-full text-center min-h-[2rem] flex items-center justify-center"
              aria-label={`Edit weight for set ${index}, currently ${currentWeight} kg`}
              data-testid={`button-edit-weight-${index}`}
            >
              {currentWeight} kg
            </button>
          )}
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 text-white hover:bg-white/10"
              aria-label={`More actions for set ${index}`}
              data-testid={`button-more-actions-${index}`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white/10 backdrop-blur-md border-white/20">
            <DropdownMenuItem
              onClick={handleRemoveClick}
              className="text-red-400 hover:bg-red-500/20 focus:bg-red-500/20"
              data-testid={`button-remove-set-${index}`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Set
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

SetRow.displayName = 'SetRow';