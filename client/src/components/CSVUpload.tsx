import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import GlassCard from "./GlassCard";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface CSVUploadProps {
  onFileSelect?: (file: File) => void;
  onParse?: (data: any[]) => void;
  isProcessing?: boolean;
  className?: string;
}

export default function CSVUpload({ 
  onFileSelect, 
  onParse, 
  isProcessing = false,
  className 
}: CSVUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setUploadStatus('error');
      console.log('Invalid file type. Please select a CSV file.');
      return;
    }

    setSelectedFile(file);
    setUploadStatus('success');
    onFileSelect?.(file);
    console.log(`CSV file selected: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleParseClick = () => {
    if (selectedFile) {
      console.log('Parsing CSV file:', selectedFile.name);
      // Mock parsing simulation
      setTimeout(() => {
        onParse?.([{ mock: 'data' }]);
      }, 1000);
    }
  };

  return (
    <GlassCard 
      variant="secondary" 
      className={cn("transition-all duration-300", className)}
    >
      <div className="p-6">
        <div className="text-center mb-6">
          <FileText className="w-12 h-12 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Import Workout Data
          </h3>
          <p className="text-white/75 text-sm">
            Upload your "TREINO SETEMBRO .csv" file to parse workout sessions
          </p>
        </div>

        {/* File Drop Zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
            dragOver 
              ? "border-primary bg-primary/10" 
              : "border-white/30 hover:border-white/50",
            uploadStatus === 'success' && "border-green-400 bg-green-400/10",
            uploadStatus === 'error' && "border-red-400 bg-red-400/10"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="csv-drop-zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
            data-testid="csv-file-input"
          />

          {!selectedFile ? (
            <div className="space-y-4">
              <Upload className={cn(
                "w-10 h-10 mx-auto transition-colors",
                dragOver ? "text-primary" : "text-white/60"
              )} />
              <div>
                <p className="text-white font-medium mb-1">
                  Drop your CSV file here
                </p>
                <p className="text-white/60 text-sm">
                  or{" "}
                  <button
                    onClick={handleBrowseClick}
                    className="text-primary hover:underline font-medium"
                    data-testid="browse-button"
                  >
                    browse files
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadStatus === 'success' ? (
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto" />
              ) : (
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              )}
              <div>
                <p className="text-white font-medium" data-testid="selected-file-name">
                  {selectedFile.name}
                </p>
                <p className="text-white/60 text-sm">
                  {(selectedFile.size / 1024).toFixed(1)}KB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {selectedFile && uploadStatus === 'success' && (
          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleParseClick}
              disabled={isProcessing}
              className="flex-1"
              data-testid="parse-button"
            >
              {isProcessing ? "Parsing..." : "Parse Workout Data"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFile(null);
                setUploadStatus('idle');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              data-testid="reset-button"
            >
              Reset
            </Button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}