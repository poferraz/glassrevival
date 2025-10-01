import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AISuggestion } from '@/utils/deepseekApi';

interface AIHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: AISuggestion | null;
  onApplySuggestion: (suggestion: AISuggestion) => void;
  isLoading?: boolean;
}

const AIHelperModal: React.FC<AIHelperModalProps> = ({
  isOpen,
  onClose,
  suggestion,
  onApplySuggestion,
  isLoading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Workout Suggestion</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Generating suggestion...</p>
            </div>
          ) : suggestion ? (
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold text-lg">{suggestion.exercise}</h3>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sets:</span>
                    <span className="ml-2 font-medium">{suggestion.sets}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reps:</span>
                    <span className="ml-2 font-medium">{suggestion.reps}</span>
                  </div>
                  {suggestion.weight && (
                    <div>
                      <span className="text-muted-foreground">Weight:</span>
                      <span className="ml-2 font-medium">{suggestion.weight}kg</span>
                    </div>
                  )}
                </div>
                {suggestion.notes && (
                  <p className="mt-2 text-sm text-muted-foreground">{suggestion.notes}</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => onApplySuggestion(suggestion)}
                  className="flex-1"
                >
                  Apply Suggestion
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No suggestion available</p>
              <Button variant="outline" onClick={onClose} className="mt-2">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIHelperModal;