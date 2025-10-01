import React, { useState, useEffect } from "react";
import { AVAILABLE_MODELS, getSelectedModel, setSelectedModel, type LLMModel } from "@/utils/modelConfig";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, Settings, Zap } from "lucide-react";

interface ModelSelectorProps {
  className?: string;
}

export default function ModelSelector({ className }: ModelSelectorProps) {
  const [selectedModelId, setSelectedModelId] = useState<string>(getSelectedModel());
  const [isOpen, setIsOpen] = useState(false);

  const selectedModel = AVAILABLE_MODELS.find(model => model.id === selectedModelId);

  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId);
    setSelectedModel(modelId);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`text-white border-white/20 hover:bg-white/10 bg-white/5 ${className}`}
        >
          <Settings className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">AI Model</span>
          <span className="sm:hidden">Model</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-white/10 backdrop-blur-md border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            Select AI Model
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-white/80 text-sm">
            Choose which AI model to use for workout suggestions and chat. All models are free and available through OpenRouter.
          </p>
          
          <div className="grid gap-3">
            {AVAILABLE_MODELS.map((model) => (
              <div
                key={model.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedModelId === model.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
                onClick={() => handleModelSelect(model.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white">{model.name}</h3>
                      {model.free && (
                        <Badge variant="outline" className="text-green-400 border-green-400/50 text-xs">
                          Free
                        </Badge>
                      )}
                    </div>
                    <p className="text-white/70 text-sm mb-1">{model.description}</p>
                    <p className="text-white/50 text-xs">Provider: {model.provider}</p>
                  </div>
                  
                  {selectedModelId === model.id && (
                    <Check className="w-5 h-5 text-blue-400 ml-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Settings className="w-4 h-4" />
              <span>Current model: {selectedModel?.name}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

