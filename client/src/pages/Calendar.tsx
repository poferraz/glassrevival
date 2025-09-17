import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SessionTemplate, SessionInstance, ScheduledSession } from "@shared/schema";
import { 
  loadSessionTemplates, 
  loadSessionInstances,
  getSessionInstancesForDate,
  loadScheduledSessions, 
  getScheduledSessionsForDate,
  formatDate,
  getTodayString,
  addDays,
  createSessionInstanceFromTemplate,
  migrateLegacyScheduledSessions
} from "@/utils/sessionStorage";
import { calculateSessionProgress } from "@/utils/workoutHelpers";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Plus, Play, Clock, CheckCircle, Dumbbell } from "lucide-react";

interface CalendarDay {
  date: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  sessions: (SessionInstance | ScheduledSession)[];
}

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [sessionTemplates, setSessionTemplates] = useState<SessionTemplate[]>([]);
  const [sessionInstances, setSessionInstances] = useState<SessionInstance[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [selectedDateSessions, setSelectedDateSessions] = useState<CombinedSession[]>([]);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");

  useEffect(() => {
    // Migrate legacy data first
    migrateLegacyScheduledSessions();
    
    // Load data
    loadData();
  }, []);

  const loadData = () => {
    setSessionTemplates(loadSessionTemplates());
    setSessionInstances(loadSessionInstances());
    setScheduledSessions(loadScheduledSessions());
  };

  useEffect(() => {
    // Generate calendar days for current month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay()); // Start from Sunday

    const days: CalendarDay[] = [];
    const today = getTodayString();

    for (let i = 0; i < 42; i++) { // 6 weeks
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = formatDate(date);
      
      // Combine both SessionInstance and legacy ScheduledSession
      const instances = getSessionInstancesForDate(dateString);
      const legacySessions = getScheduledSessionsForDate(dateString);
      const combinedSessions = [...instances, ...legacySessions];
      
      days.push({
        date: dateString,
        isToday: dateString === today,
        isCurrentMonth: date.getMonth() === month,
        sessions: combinedSessions
      });
    }

    setCalendarDays(days);
  }, [currentDate, sessionInstances, scheduledSessions]);

  useEffect(() => {
    // Update selected date sessions - combine SessionInstance and ScheduledSession
    const instances = getSessionInstancesForDate(selectedDate);
    const legacySessions = getScheduledSessionsForDate(selectedDate);
    
    const combinedSessions: CombinedSession[] = [
      ...instances.map(instance => ({
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
      })),
      ...legacySessions.map(session => {
        const template = getSessionTemplate(session.templateId);
        return {
          id: session.id,
          templateId: session.templateId,
          date: session.date,
          startTime: session.startTime,
          status: session.status,
          completedAt: session.completedAt,
          notes: session.notes,
          name: template?.name,
          exercises: template?.exercises,
          estimatedDurationMinutes: template?.estimatedDurationMinutes
        };
      })
    ];
    
    setSelectedDateSessions(combinedSessions);
  }, [selectedDate, sessionInstances, scheduledSessions, sessionTemplates]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const getSessionTemplate = (templateId: string): SessionTemplate | null => {
    return sessionTemplates.find(t => t.id === templateId) || null;
  };

  const handleScheduleSession = () => {
    if (!selectedTemplateId) return;
    
    const template = sessionTemplates.find(t => t.id === selectedTemplateId);
    if (!template) return;
    
    try {
      const startTime = selectedStartTime === "anytime" || selectedStartTime === "" ? undefined : selectedStartTime;
      createSessionInstanceFromTemplate(template, selectedDate, startTime);
      loadData(); // Refresh data
      setIsScheduleDialogOpen(false);
      setSelectedTemplateId("");
      setSelectedStartTime("");
      console.log(`Session "${template.name}" scheduled for ${selectedDate}`);
    } catch (error) {
      console.error('Failed to schedule session:', error);
    }
  };

  const handleStartSession = (sessionId: string) => {
    navigate(`/workout/${sessionId}`);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}:00`).toLocaleTimeString([], { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        slots.push({ value: timeString, label: displayTime });
      }
    }
    return slots;
  };

  const getSessionStatusIcon = (session: ScheduledSession) => {
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
    <Layout>
      <div className="space-y-6">
        {/* Calendar Header */}
        <GlassCard variant="secondary">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white" data-testid="calendar-title">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h1>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => navigateMonth('prev')}
                  className="text-white hover:text-white"
                  data-testid="button-prev-month"
                >
                  <CalendarIcon className="w-4 h-4 rotate-180" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => navigateMonth('next')}
                  className="text-white hover:text-white"
                  data-testid="button-next-month"
                >
                  <CalendarIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-xs font-medium text-white/60">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day.date)}
                  className={`
                    relative p-2 min-h-[40px] text-sm rounded-lg transition-all
                    ${day.isCurrentMonth ? 'text-white' : 'text-white/30'}
                    ${day.isToday ? 'bg-blue-600/50 ring-2 ring-blue-400' : ''}
                    ${selectedDate === day.date ? 'bg-white/20' : 'hover:bg-white/10'}
                  `}
                  data-testid={`calendar-day-${day.date}`}
                >
                  <div className="text-center">
                    {new Date(day.date + 'T00:00:00').getDate()}
                  </div>
                  {day.sessions.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className="flex gap-0.5">
                        {day.sessions.slice(0, 3).map((session, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              session.status === 'completed' ? 'bg-green-400' :
                              session.status === 'in_progress' ? 'bg-blue-400' :
                              session.status === 'skipped' ? 'bg-gray-400' :
                              'bg-white/60'
                            }`}
                          />
                        ))}
                        {day.sessions.length > 3 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        )}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Selected Date Details */}
        <GlassCard variant="tertiary">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white" data-testid="selected-date-title">
                  {formatSelectedDate(selectedDate)}
                </h2>
                {isDateToday(selectedDate) && (
                  <p className="text-sm text-blue-300">Today</p>
                )}
              </div>
              <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-white border-white/20 hover:bg-white/10"
                    data-testid="button-add-session"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900/95 border-white/20 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Schedule Session for {formatSelectedDate(selectedDate)}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium text-white/80 mb-2 block">Select Template</label>
                      <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Choose a workout template..." />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/20">
                          {sessionTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id} className="text-white hover:bg-white/10">
                              <div className="flex items-center gap-2">
                                <Dumbbell className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">{template.name}</div>
                                  <div className="text-xs text-white/60">
                                    {template.exercises.length} exercises • {template.estimatedDurationMinutes || 'Unknown'}min
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-white/80 mb-2 block">Start Time (Optional)</label>
                      <Select value={selectedStartTime} onValueChange={setSelectedStartTime}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Any time" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/20 max-h-60">
                          <SelectItem value="anytime" className="text-white hover:bg-white/10">Any time</SelectItem>
                          {generateTimeSlots().map((slot) => (
                            <SelectItem key={slot.value} value={slot.value} className="text-white hover:bg-white/10">
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1 text-white border-white/20 hover:bg-white/10"
                        onClick={() => setIsScheduleDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleScheduleSession}
                        disabled={!selectedTemplateId}
                        data-testid="button-confirm-schedule"
                      >
                        Schedule Session
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Sessions for Selected Date */}
            {selectedDateSessions.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/60 mb-4">No sessions scheduled for this day</p>
                <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-white border-white/20 hover:bg-white/10"
                      data-testid="button-schedule-first-session"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule Your First Session
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            ) : (
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
                        {getSessionStatusIcon(session)}
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
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleStartSession(session.id)}
                            data-testid={`button-start-session-${session.id}`}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                        )}
                        {session.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleStartSession(session.id)}
                            data-testid={`button-continue-session-${session.id}`}
                          >
                            Continue
                          </Button>
                        )}
                        {session.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white/60"
                            data-testid={`button-view-session-${session.id}`}
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Quick Stats */}
        {isDateToday(selectedDate) && selectedDateSessions.length > 0 && (
          <GlassCard variant="tertiary">
            <div className="p-4">
              <h3 className="text-sm font-medium text-white/80 mb-3">Today's Progress</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">
                    {selectedDateSessions.filter(s => s.status === 'completed').length}
                  </div>
                  <div className="text-xs text-white/60">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">
                    {selectedDateSessions.filter(s => s.status === 'in_progress').length}
                  </div>
                  <div className="text-xs text-white/60">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">
                    {selectedDateSessions.filter(s => s.status === 'scheduled').length}
                  </div>
                  <div className="text-xs text-white/60">Scheduled</div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </Layout>
  );
}