import { useState } from "react";
import { useLocation } from "wouter";
import CSVUpload from "@/components/CSVUpload";
import ImportReport from "@/components/ImportReport";
import { parseTrainingCSV, ParsedTrainingCSV } from "@/utils/trainingCsvParser";
import { saveSessionTemplate } from "@/utils/sessionStorage";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function Import() {
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTrainingCSV | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savedSessions, setSavedSessions] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setParsedData(null);
    setSavedSessions([]);
    setSaveError(null);
  };

  const handleParse = async (data: any[]) => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setSaveError(null);
    
    try {
      const content = await selectedFile.text();
      const parsed = parseTrainingCSV(content);
      setParsedData(parsed);
      
      // Automatically save sessions after parsing
      if (parsed.sessions.length > 0) {
        const savedIds: string[] = [];
        
        for (const session of parsed.sessions) {
          try {
            const savedSession = saveSessionTemplate(session);
            savedIds.push(savedSession.id);
          } catch (error) {
            console.error(`Failed to save session "${session.name}":`, error);
          }
        }
        
        setSavedSessions(savedIds);
        console.log(`Successfully saved ${savedIds.length} workout sessions`);
        
        // Navigate to sessions after successful save
        setTimeout(() => {
          navigate('/sessions');
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setSaveError('Failed to parse or save sessions. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="space-y-6">
      <CSVUpload
        onFileSelect={handleFileSelect}
        onParse={handleParse}
        isProcessing={isProcessing}
      />

      {parsedData && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Import Results</h2>
            <p className="text-white/75">
              Successfully parsed {parsedData.sessions.length} workout sessions
            </p>
          </div>
          
          {parsedData.errors.length > 0 && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold mb-2">Parsing Errors:</h3>
              <ul className="text-red-300 text-sm space-y-1">
                {parsedData.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {saveError && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 font-semibold">{saveError}</p>
              </div>
            </div>
          )}
          
          {savedSessions.length > 0 && (
            <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400 font-semibold">
                  Successfully saved {savedSessions.length} workout sessions!
                </p>
              </div>
              <p className="text-green-300 text-sm mt-1">
                Redirecting to My Workouts...
              </p>
            </div>
          )}
          
          <div className="grid gap-4">
            {parsedData.sessions.map((session, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">{session.name}</h3>
                    <p className="text-white/75 text-sm">
                      {session.exercises.length} exercises • {session.estimatedDurationMinutes || 'Unknown'} minutes
                    </p>
                  </div>
                  {savedSessions.includes(session.id) && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {parsedData.sessions.length > 0 && savedSessions.length === 0 && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setParsedData(null);
                  setSelectedFile(null);
                  setSavedSessions([]);
                  setSaveError(null);
                }}
              >
                Start Over
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
