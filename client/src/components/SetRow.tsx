import { useState, useCallback, memo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Circle, 
  Plus, 
  Minus, 
  MoreHorizontal,
  Trash2,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  isOpen: boolean;
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
    isOpen: false,
    reps,
    weight
  });

  // Refs for input elements
  const repsInputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);

  const openEditDialog = useCallback(() => {
    setEditState({
      isOpen: true,
      reps,
      weight
    });
  }, [reps, weight]);

  const closeEditDialog = useCallback(() => {
    setEditState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const saveChanges = useCallback(() => {
    onChange({
      reps: editState.reps,
      weight: editState.weight
    });
    closeEditDialog();
  }, [editState.reps, editState.weight, onChange, closeEditDialog]);

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveChanges();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeEditDialog();
    }
  }, [saveChanges, closeEditDialog]);

  // Auto-focus first input when dialog opens
  useEffect(() => {
    if (editState.isOpen && repsInputRef.current) {
      setTimeout(() => {
        repsInputRef.current?.focus();
      }, 100);
    }
  }, [editState.isOpen]);

  // Format display text based on unit and values
  const getDisplayText = useCallback(() => {
    const displayValue = unit === 'reps' ? reps :
      unit === 'seconds' ? reps :
      reps; // steps
    
    let valueText = '';
    if (unit === 'reps') {
      valueText = `${displayValue} ${perSide ? 'REPS PER LEG' : 'REPS'}`;
    } else if (unit === 'seconds') {
      valueText = `${displayValue} SECONDS`;
    } else {
      valueText = `${displayValue} STEPS`;
    }
    
    let weightText = '';
    if (weight > 0) {
      weightText = ` • ${weight} KG`;
    } else {
      weightText = ' • BODYWEIGHT';
    }
    
    return `${valueText}${weightText}`;
  }, [unit, reps, weight, perSide]);

  return (
    <>
      {/* Compact Single-Line Row */}
      <div className="grid grid-cols-[auto_auto_1fr_auto] gap-3 items-center py-3 px-0 min-h-12 hover:bg-white/5 transition-colors">
        {/* Completion Toggle */}
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleComplete}
          className="shrink-0 text-white hover:bg-white/10 h-8 w-8"
          aria-label={`${completed ? 'Mark incomplete' : 'Mark complete'} set ${index}`}
          data-testid={`button-toggle-complete-${index}`}
        >
          {completed ? (
            <CheckCircle className="w-6 h-6 text-green-400" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </Button>

        {/* Set Badge */}
        <Badge 
          variant="outline" 
          className="shrink-0 text-white border-white/20 bg-white/5 hover:bg-white/10 px-2 py-1 text-xs font-medium"
          data-testid={`badge-set-${index}`}
        >
          Set {index}
        </Badge>

        {/* Reps x Weight Display - Clickable */}
        <button
          onClick={openEditDialog}
          className="text-left text-white/90 hover:text-white transition-colors text-sm font-medium uppercase tracking-wide truncate"
          aria-label={`Edit set ${index}: ${getDisplayText()}`}
          data-testid={`button-edit-set-${index}`}
        >
          {getDisplayText()}
        </button>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 text-white hover:bg-white/10 h-8 w-8"
              aria-label={`More actions for set ${index}`}
              data-testid={`button-more-actions-${index}`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white/10 backdrop-blur-md border-white/20">
            <DropdownMenuItem
              onClick={openEditDialog}
              className="text-white hover:bg-white/20 focus:bg-white/20"
              data-testid={`button-edit-set-menu-${index}`}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Set
            </DropdownMenuItem>
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

      {/* Edit Dialog */}
      <Dialog open={editState.isOpen} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-center">
              Edit Set {index}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Reps/Duration/Steps Section */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-white/80 text-center">
                {unit === 'reps' ? (perSide ? 'Reps per side' : 'Reps') : unit === 'seconds' ? 'Duration (seconds)' : 'Steps'}
              </div>
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
                  value={editState.reps}
                  onChange={(e) => updateEditValue('reps', parseInt(e.target.value) || 0)}
                  onKeyDown={handleKeyDown}
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
            </div>

            {/* Weight Section */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-white/80 text-center">
                Weight (kg)
              </div>
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
                  value={editState.weight}
                  onChange={(e) => updateEditValue('weight', parseFloat(e.target.value) || 0)}
                  onKeyDown={handleKeyDown}
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
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={closeEditDialog}
              className="text-white border-white/20 hover:bg-white/10"
              data-testid={`button-cancel-edit-${index}`}
            >
              Cancel
            </Button>
            <Button 
              onClick={saveChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid={`button-save-edit-${index}`}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

SetRow.displayName = 'SetRow';