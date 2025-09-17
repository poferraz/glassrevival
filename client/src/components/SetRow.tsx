import { useState, useCallback, memo, useRef, useEffect } from "react";
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
  unit: 'reps' | 'seconds' | 'steps';
  perSide?: boolean;
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
  unit,
  perSide = false,
  onChange,
  onToggleComplete,
  onRemove
}: SetRowProps) {
  const [editState, setEditState] = useState<EditState>({
    isEditing: null,
    reps,
    weight
  });

  // Refs for input elements and row
  const repsInputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const startEditing = useCallback((field: 'reps' | 'weight') => {
    setEditState({
      isEditing: field,
      reps,
      weight
    });
  }, [reps, weight]);

  const cancelEditing = useCallback(() => {
    // Restore original values without saving
    setEditState({
      isEditing: null,
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, field: 'reps' | 'weight') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEditing();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  }, [finishEditing, cancelEditing]);

  // Auto-focus and scroll into view when entering edit mode
  useEffect(() => {
    if (editState.isEditing === 'reps' && repsInputRef.current) {
      repsInputRef.current.focus();
      // Smooth scroll to keep the row visible above keyboard within the constrained container
      setTimeout(() => {
        rowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest', // More conservative - scrolls within container only if needed
          inline: 'nearest'
        });
      }, 100);
    } else if (editState.isEditing === 'weight' && weightInputRef.current) {
      weightInputRef.current.focus();
      // Smooth scroll to keep the row visible above keyboard within the constrained container
      setTimeout(() => {
        rowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest', // More conservative - scrolls within container only if needed
          inline: 'nearest'
        });
      }, 100);
    }
  }, [editState.isEditing]);

  const currentReps = editState.isEditing === 'reps' ? editState.reps : reps;
  const currentWeight = editState.isEditing === 'weight' ? editState.weight : weight;

  return (
    <div 
      ref={rowRef}
      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 scroll-margin-top"
    >
      {/* Top Row - Always horizontal: Completion Toggle, Set Index, Actions Menu */}
      <div className="flex items-center justify-between mb-3">
        {/* Completion Toggle - Larger for mobile */}
        <Button
          size="default"
          variant="ghost"
          onClick={onToggleComplete}
          className="shrink-0 text-white hover:bg-white/10 min-h-10 min-w-10 p-0"
          aria-label={`${completed ? 'Mark incomplete' : 'Mark complete'} set ${index}`}
          data-testid={`button-toggle-complete-${index}`}
        >
          {completed ? (
            <CheckCircle className="w-7 h-7 text-green-400" />
          ) : (
            <Circle className="w-7 h-7" />
          )}
        </Button>

        {/* Set Index */}
        <div className="text-xl font-semibold text-white" data-testid={`text-set-index-${index}`}>
          Set {index}
        </div>

        {/* Actions Menu - Larger for mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="default"
              variant="ghost"
              className="shrink-0 text-white hover:bg-white/10 min-h-10 min-w-10 p-0"
              aria-label={`More actions for set ${index}`}
              data-testid={`button-more-actions-${index}`}
            >
              <MoreHorizontal className="w-5 h-5" />
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

      {/* Main Content - Mobile-friendly stacked layout */}
      <div className="space-y-4">
        {/* Reps Display/Edit */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-white/80 text-center">
            {unit === 'reps' ? (perSide ? 'Reps per side' : 'Reps') : unit === 'seconds' ? 'Duration' : 'Steps'}
          </div>
          {editState.isEditing === 'reps' ? (
            <div className="flex items-center gap-3">
              <Button
                size="default"
                variant="outline"
                onClick={() => decrementValue('reps')}
                className="text-white border-white/20 hover:bg-white/10 shrink-0 min-h-12 min-w-12 p-0"
                data-testid={`button-decrement-${unit}-${index}`}
              >
                <Minus className="w-5 h-5" />
              </Button>
              
              <Input
                ref={repsInputRef}
                type="number"
                inputMode="numeric"
                value={currentReps}
                onChange={(e) => updateEditValue('reps', parseInt(e.target.value) || 0)}
                onBlur={finishEditing}
                onKeyDown={(e) => handleKeyDown(e, 'reps')}
                className="text-center text-2xl font-bold bg-white/10 border-white/20 text-white min-h-14 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                data-testid={`input-${unit}-${index}`}
              />
              
              <Button
                size="default"
                variant="outline"
                onClick={() => incrementValue('reps')}
                className="text-white border-white/20 hover:bg-white/10 shrink-0 min-h-12 min-w-12 p-0"
                data-testid={`button-increment-${unit}-${index}`}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => startEditing('reps')}
              className="text-2xl font-bold text-white hover:text-blue-300 transition-colors w-full text-center min-h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl border border-white/10"
              aria-label={`Edit ${unit === 'reps' ? 'reps' : unit === 'seconds' ? 'seconds' : 'steps'} for set ${index}, currently ${currentReps}`}
              data-testid={`button-edit-${unit}-${index}`}
            >
              {currentReps} {unit === 'seconds' ? 's' : ''}
            </button>
          )}
        </div>

        {/* Weight Display/Edit */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-white/80 text-center">
            Weight
          </div>
          {editState.isEditing === 'weight' ? (
            <div className="flex items-center gap-3">
              <Button
                size="default"
                variant="outline"
                onClick={() => decrementValue('weight')}
                className="text-white border-white/20 hover:bg-white/10 shrink-0 min-h-12 min-w-12 p-0"
                data-testid={`button-decrement-weight-${index}`}
              >
                <Minus className="w-5 h-5" />
              </Button>
              
              <Input
                ref={weightInputRef}
                type="number"
                inputMode="decimal"
                step="0.5"
                value={currentWeight}
                onChange={(e) => updateEditValue('weight', parseFloat(e.target.value) || 0)}
                onBlur={finishEditing}
                onKeyDown={(e) => handleKeyDown(e, 'weight')}
                className="text-center text-2xl font-bold bg-white/10 border-white/20 text-white min-h-14 rounded-xl"
                data-testid={`input-weight-${index}`}
              />
              
              <Button
                size="default"
                variant="outline"
                onClick={() => incrementValue('weight')}
                className="text-white border-white/20 hover:bg-white/10 shrink-0 min-h-12 min-w-12 p-0"
                data-testid={`button-increment-weight-${index}`}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => startEditing('weight')}
              className="text-2xl font-bold text-white hover:text-blue-300 transition-colors w-full text-center min-h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl border border-white/10"
              aria-label={`Edit weight for set ${index}, currently ${currentWeight} kg`}
              data-testid={`button-edit-weight-${index}`}
            >
              {currentWeight} kg
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

SetRow.displayName = 'SetRow';