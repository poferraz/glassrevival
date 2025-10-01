import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SessionTemplate, SessionInstance } from "@shared/schema";
import { 
  loadSessionTemplates, 
  loadSessionInstances,
  getSessionInstancesForDate,
  formatDate,
  getTodayString,
  createSessionInstanceFromTemplate,
  getSessionTemplate
} from "@/utils/sessionStorage";
import { calculateSessionProgress } from "@/utils/workoutHelpers";
import GlassCard from "@/components/GlassCard";
import { GlassCalendar } from "@/components/ui/glass-calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Plus, Play, Clock, CheckCircle, Dumbbell } from "lucide-react";

interface CombinedSession {
  id: string;
  templateId: string;
  date: string;
  startTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: string;
  notes?: string;
  name?: string;
  exercises?: any[];
  estimatedDurationMinutes?: number;
}

export default function Calendar() {
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateString, setSelectedDateString] = useState<string>(getTodayString());
  const [sessionTemplates, setSessionTemplates] = useState<SessionTemplate[]>([]);
  const [sessionInstances, setSessionInstances] = useState<SessionInstance[]>([]);
  const [selectedDateSessions, setSelectedDateSessions] = useState<CombinedSession[]>([]);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSessionTemplates(loadSessionTemplates());
    setSessionInstances(loadSessionInstances());
  };

  useEffect(() => {
    // Update selected date sessions from SessionInstances
    const instances = getSessionInstancesForDate(selectedDateString);
    
    const combinedSessions: CombinedSession[] = instances.map(instance => ({
      id: instance.id,
      templateId: instance.templateId,
      date: instance.date,
      startTime: instance.startTime,
      status: instance.status,
      completedAt: instance.completedAt,
      notes: instance.notes,
      name: instance.templateSnapshot.name,
      exercises: instance.templateSnapshot.exercises,
      estimatedDurationMinutes: instance.templateSnapshot.estimatedDurationMinutes
    }));
    
    setSelectedDateSessions(combinedSessions);
  }, [selectedDateString, sessionInstances, sessionTemplates]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedDateString(formatDate(date));
  };

  const getSessionTemplate = (templateId: string): SessionTemplate | null => {
    return sessionTemplates.find(t => t.id === templateId) || null;
  };

  const handleStartSession = (sessionId: string) => {
    navigate(`/workout/${sessionId}`);
  };

  const getSessionStatusIcon = (session: CombinedSession) => {
    switch (session.status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'in_progress':
        return <Play className="w-3 h-3 text-blue-400" />;
      case 'skipped':
        return <Clock className="w-3 h-3 text-gray-400" />;
      default:
        return <CalendarIcon className="w-3 h-3 text-white/60" />;
    }
  };

  const formatSelectedDate = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isDateToday = (dateString: string): boolean => {
    return dateString === getTodayString();
  };

  return (
    <div className="space-y-6">
        {/* Glass Calendar */}
        <div className="flex justify-center">
          <GlassCalendar 
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        </div>

        {/* Selected Date Details - Glass Morphism Design */}
        <div className="w-full max-w-[360px] mx-auto rounded-3xl p-5 shadow-2xl bg-black/20 backdrop-blur-xl border border-white/10 text-white font-sans">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white" data-testid="selected-date-title">
                {new Date(selectedDateString + 'T00:00:00').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
            </div>
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
              <DialogTrigger asChild>
                <button className="p-2 text-white/70 transition-colors hover:bg-black/20 rounded-full">
                  <Plus className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent className="bg-black/20 backdrop-blur-xl border border-white/10 text-white max-w-md rounded-3xl shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Choose your Sessions below</DialogTitle>
                </DialogHeader>
                <div className="pt-4">
                  {sessionTemplates.length === 0 ? (
                    <div className="text-center py-8">
                      <Dumbbell className="w-12 h-12 text-white/30 mx-auto mb-3" />
                      <p className="text-white/60 mb-4">No workout sessions available</p>
                      <p className="text-white/40 text-sm">Import some sessions first to schedule them</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {sessionTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => {
                            createSessionInstanceFromTemplate(template, selectedDateString);
                            loadData(); // Refresh data
                            setIsScheduleDialogOpen(false);
                            console.log(`Session "${template.name}" scheduled for ${selectedDateString}`);
                          }}
                          className="w-full p-3 text-left bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Dumbbell className="w-5 h-5 text-white/60" />
                            <div className="flex-1">
                              <div className="font-medium text-white">{template.name}</div>
                              <div className="text-sm text-white/60">
                                {template.exercises.length} exercises • {template.estimatedDurationMinutes || 'Unknown'}min
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-white/40" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Sessions List - Only show when sessions exist */}
          {selectedDateSessions.length > 0 && (
            <div className="space-y-3">
              {selectedDateSessions.map((session) => {
                const template = getSessionTemplate(session.templateId);
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    data-testid={`session-${session.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-12 bg-white/30 rounded-full"></div>
                      <div>
                        <h3 className="font-medium text-white">
                          {session.name || 'Unknown Session'}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          {session.startTime && (
                            <span>
                              {new Date(`2000-01-01T${session.startTime}:00`).toLocaleTimeString([], { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                          )}
                          {session.exercises && (
                            <span>{session.exercises.length} exercises</span>
                          )}
                          {session.estimatedDurationMinutes && (
                            <span>{session.estimatedDurationMinutes}min</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {session.status === 'scheduled' && (
                        <button
                          onClick={() => handleStartSession(session.id)}
                          className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-lg transition-colors hover:bg-white/30 border border-white/20"
                          data-testid={`button-start-session-${session.id}`}
                        >
                          Start
                        </button>
                      )}
                      {session.status === 'in_progress' && (
                        <button
                          onClick={() => handleStartSession(session.id)}
                          className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-lg transition-colors hover:bg-white/30 border border-white/20"
                          data-testid={`button-continue-session-${session.id}`}
                        >
                          Continue
                        </button>
                      )}
                      {session.status === 'completed' && (
                        <button
                          className="px-3 py-1 text-white/60 text-xs font-bold rounded-lg transition-colors hover:text-white"
                          data-testid={`button-view-session-${session.id}`}
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
  );
}