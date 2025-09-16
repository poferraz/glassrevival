import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import CSVUpload from "@/components/CSVUpload";
import WorkoutDayNav from "@/components/WorkoutDayNav";
import WorkoutSession from "@/components/WorkoutSession";
import ImportReport from "@/components/ImportReport";
import { parseCSV, ParsedExerciseData } from "@/utils/csvParser";
import { readFileAsText, validateCSVFile } from "@/utils/fileReader";
import { 
  saveWorkoutData, 
  loadWorkoutData, 
  clearWorkoutData,
  saveSelectedDay,
  loadSelectedDay
} from "@/utils/storage";
import { Exercise } from "@/components/ExerciseCard";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import { Upload, Activity } from "lucide-react";

interface WorkoutDay {
  id: string;
  label: string;
  machineKey: string;
  exerciseCount: number;
}

export default function Home() {
  const [workoutData, setWorkoutData] = useState<ParsedExerciseData[]>([]);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [showImportReport, setShowImportReport] = useState(false);
  const [importStats, setImportStats] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    const stored = loadWorkoutData();
    if (stored && stored.data.length > 0) {
      setWorkoutData(stored.data);
      
      // Group exercises by day
      const dayGroups = stored.data.reduce((groups, exercise: any) => {
        const dayId = exercise.dayKey;
        if (!groups[dayId]) {
          groups[dayId] = {
            id: dayId,
            label: exercise.day,
            machineKey: exercise.dayKey,
            exerciseCount: 0,
            exercises: []
          };
        }
        groups[dayId].exercises.push(exercise);
        groups[dayId].exerciseCount++;
        return groups;
      }, {} as any);
      
      const days = Object.values(dayGroups) as WorkoutDay[];
      setWorkoutDays(days);
      
      // Load saved selected day or default to first
      const savedDay = loadSelectedDay();
      const dayToSelect = savedDay && days.find(d => d.id === savedDay) ? savedDay : days[0]?.id || "";
      setSelectedDayId(dayToSelect);
      
      console.log(`Loaded ${stored.data.length} exercises from storage (last imported: ${stored.lastImported})`);
    }
  }, []);

  // Convert parsed data to Exercise format
  const convertToExercise = (data: ParsedExerciseData): Exercise => ({
    id: data.id,
    name: data.exercise,
    sets: data.sets,
    repsMin: data.prescription.repsMin ?? undefined,
    repsMax: data.prescription.repsMax ?? undefined,
    timeSecondsMin: data.prescription.timeSecondsMin ?? undefined,
    timeSecondsMax: data.prescription.timeSecondsMax ?? undefined,
    stepsCount: data.prescription.stepsCount ?? undefined,
    unit: data.prescription.unit,
    perSide: data.prescription.perSide,
    weight: data.weight,
    notes: data.notes,
    formGuidance: data.formGuidance,
    muscleGroup: data.muscleGroup,
    mainMuscle: data.mainMuscle
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    console.log(`CSV file selected: ${file.name}`);
  };

  const handleParseCSV = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    console.log('Starting CSV parsing...');
    
    try {
      // Validate file first
      const validation = validateCSVFile(selectedFile);
      if (!validation.isValid) {
        console.error('File validation failed:', validation.error);
        setIsProcessing(false);
        return;
      }
      
      // Read file content
      const csvContent = await readFileAsText(selectedFile);
      console.log(`File read successfully: ${csvContent.length} characters`);
      
      // Parse CSV content
      const result = await parseCSV(csvContent);
      
      setWorkoutData(result.data);
      setImportStats(result.stats);
      
      // Save to persistent storage
      saveWorkoutData(result.data, selectedFile.name);
      
      // Group exercises by day
      const dayGroups = result.data.reduce((groups, exercise) => {
        const dayId = exercise.dayKey;
        if (!groups[dayId]) {
          groups[dayId] = {
            id: dayId,
            label: exercise.day,
            machineKey: exercise.dayKey,
            exerciseCount: 0,
            exercises: []
          };
        }
        groups[dayId].exercises.push(exercise);
        groups[dayId].exerciseCount++;
        return groups;
      }, {} as any);
      
      const days = Object.values(dayGroups) as WorkoutDay[];
      setWorkoutDays(days);
      const newSelectedDay = days[0]?.id || "";
      setSelectedDayId(newSelectedDay);
      saveSelectedDay(newSelectedDay);
      
      setShowImportReport(true);
      setIsProcessing(false);
      
      console.log(`Parsed ${result.data.length} exercises across ${days.length} workout days`);
    } catch (error) {
      console.error('CSV parsing failed:', error);
      setIsProcessing(false);
      // Could show error toast here
    }
  };

  const getSelectedDayExercises = (): Exercise[] => {
    if (!selectedDayId || !workoutData.length) return [];
    
    return workoutData
      .filter(data => data.dayKey === selectedDayId)
      .map(convertToExercise);
  };

  const getSelectedDayLabel = (): string => {
    if (!selectedDayId || !workoutDays.length) return "";
    return workoutDays.find(day => day.id === selectedDayId)?.label || "";
  };

  const handleStartDemo = async () => {
    // Load demo data
    const demoResult = await parseCSV("demo");
    setWorkoutData(demoResult.data);
    
    // Group demo exercises by day
    const dayGroups = demoResult.data.reduce((groups, exercise) => {
      const dayId = exercise.dayKey;
      if (!groups[dayId]) {
        groups[dayId] = {
          id: dayId,
          label: exercise.day,
          machineKey: exercise.dayKey,
          exerciseCount: 0,
          exercises: []
        };
      }
      groups[dayId].exercises.push(exercise);
      groups[dayId].exerciseCount++;
      return groups;
    }, {} as any);
    
    const days = Object.values(dayGroups) as WorkoutDay[];
    setWorkoutDays(days);
    const newSelectedDay = days[0]?.id || "";
    setSelectedDayId(newSelectedDay);
    saveSelectedDay(newSelectedDay);
    
    // Save demo data to storage
    saveWorkoutData(demoResult.data, 'Demo Workout');
    
    console.log('Demo workout loaded');
  };

  // Show CSV upload if no data
  if (!workoutData.length) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Welcome Section */}
          <GlassCard variant="primary">
            <div className="p-8 text-center">
              <Activity className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-3" data-testid="welcome-title">
                Welcome to FitTracker
              </h1>
              <p className="text-white/80 mb-6 text-lg">
                Your glass morphism fitness training companion with advanced CSV parsing
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={handleStartDemo}
                  size="lg"
                  data-testid="demo-button"
                >
                  Try Demo Workout
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => document.getElementById('csv-upload')?.scrollIntoView()}
                  data-testid="upload-button"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* CSV Upload Section */}
          <div id="csv-upload">
            <CSVUpload
              onFileSelect={handleFileSelect}
              onParse={handleParseCSV}
              isProcessing={isProcessing}
            />
          </div>

          {/* Import Report */}
          {showImportReport && importStats && selectedFile && (
            <ImportReport
              stats={importStats}
              filename={selectedFile.name}
              onClose={() => setShowImportReport(false)}
            />
          )}
        </div>
      </Layout>
    );
  }

  // Show workout interface
  return (
    <Layout>
      <div className="space-y-6">
        {/* Workout Day Navigation */}
        <WorkoutDayNav
          days={workoutDays}
          activeDayId={selectedDayId}
          onDaySelect={(dayId) => {
            setSelectedDayId(dayId);
            saveSelectedDay(dayId);
          }}
        />

        {/* Current Workout Session */}
        {selectedDayId && (
          <WorkoutSession
            dayLabel={getSelectedDayLabel()}
            exercises={getSelectedDayExercises()}
            onExerciseComplete={(exerciseId) => 
              console.log(`Exercise completed: ${exerciseId}`)
            }
            onSessionComplete={() => 
              console.log('Workout session completed!')
            }
          />
        )}

        {/* Quick Actions */}
        <GlassCard variant="tertiary">
          <div className="p-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => {
                clearWorkoutData();
                setWorkoutData([]);
                setWorkoutDays([]);
                setSelectedDayId("");
              }}
              data-testid="reset-button"
            >
              Import New CSV
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setShowImportReport(true)}
              data-testid="show-report-button"
            >
              View Import Report
            </Button>
          </div>
        </GlassCard>

        {/* Import Report Modal */}
        {showImportReport && importStats && selectedFile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
              <ImportReport
                stats={importStats}
                filename={selectedFile.name}
                onClose={() => setShowImportReport(false)}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}