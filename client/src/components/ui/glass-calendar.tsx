import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, isSameDay, isToday, getDate, getDaysInMonth, startOfMonth, startOfWeek, endOfWeek, addDays } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Assuming you have a `cn` utility from shadcn

// --- TYPE DEFINITIONS ---
interface Day {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
}

interface GlassCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

// --- HELPER TO HIDE SCROLLBAR ---
const ScrollbarHide = () => (
  <style>{`
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);


// --- MAIN COMPONENT ---
export const GlassCalendar = React.forwardRef<HTMLDivElement, GlassCalendarProps>(
  ({ className, selectedDate: propSelectedDate, onDateSelect, ...props }, ref) => {
    const [currentMonth, setCurrentMonth] = React.useState(propSelectedDate || new Date());
    const [selectedDate, setSelectedDate] = React.useState(propSelectedDate || new Date());
    const [viewMode, setViewMode] = React.useState<'weekly' | 'monthly'>('monthly');
    const [currentWeek, setCurrentWeek] = React.useState(propSelectedDate || new Date());


    // Sync internal state with external prop
    React.useEffect(() => {
      if (propSelectedDate) {
        setSelectedDate(propSelectedDate);
        setCurrentMonth(propSelectedDate);
        setCurrentWeek(propSelectedDate);
      }
    }, [propSelectedDate]);

    // Generate all days for the current month
    const monthDays = React.useMemo(() => {
        const start = startOfMonth(currentMonth);
        const totalDays = getDaysInMonth(currentMonth);
        const days: Day[] = [];
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(start.getFullYear(), start.getMonth(), i + 1);
            days.push({
                date,
                isToday: isToday(date),
                isSelected: isSameDay(date, selectedDate),
            });
        }
        return days;
    }, [currentMonth, selectedDate]);

    // Generate days for the current week
    const weekDays = React.useMemo(() => {
        const start = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Sunday start
        const days: Day[] = [];
        for (let i = 0; i < 7; i++) {
            const date = addDays(start, i);
            days.push({
                date,
                isToday: isToday(date),
                isSelected: isSameDay(date, selectedDate),
            });
        }
        return days;
    }, [currentWeek, selectedDate]);

    const handleDateClick = (date: Date) => {
      setSelectedDate(date);
      onDateSelect?.(date);
    };
    
    const handlePrevMonth = () => {
        const newMonth = subMonths(currentMonth, 1);
        setCurrentMonth(newMonth);
        // Always update selected date to first day of new month when navigating
        const firstDay = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
        setSelectedDate(firstDay);
        onDateSelect?.(firstDay);
    };

    const handleNextMonth = () => {
        const newMonth = addMonths(currentMonth, 1);
        setCurrentMonth(newMonth);
        // Always update selected date to first day of new month when navigating
        const firstDay = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
        setSelectedDate(firstDay);
        onDateSelect?.(firstDay);
    };

    const handlePrevWeek = () => {
        const newWeek = addDays(currentWeek, -7);
        setCurrentWeek(newWeek);
        setSelectedDate(newWeek);
        onDateSelect?.(newWeek);
    };

    const handleNextWeek = () => {
        const newWeek = addDays(currentWeek, 7);
        setCurrentWeek(newWeek);
        setSelectedDate(newWeek);
        onDateSelect?.(newWeek);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-[360px] rounded-3xl p-5 shadow-2xl",
          "bg-black/20 backdrop-blur-xl border border-white/10",
          "text-white font-sans",
          className
        )}
        {...props}
      >
        <ScrollbarHide />
        {/* Header: Tabs */}
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-1 rounded-lg bg-black/20 p-1">
            <button 
              onClick={() => {
                console.log('Switching to weekly view');
                setViewMode('weekly');
              }}
              className={`rounded-md px-4 py-1 text-xs font-semibold transition-colors ${
                viewMode === 'weekly' 
                  ? 'bg-white text-black shadow-md font-bold' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button 
              onClick={() => {
                console.log('Switching to monthly view');
                setViewMode('monthly');
              }}
              className={`rounded-md px-4 py-1 text-xs font-semibold transition-colors ${
                viewMode === 'monthly' 
                  ? 'bg-white text-black shadow-md font-bold' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Date Display and Navigation */}
        <div className="my-6 flex items-center justify-between relative">
            <motion.p 
              key={viewMode === 'monthly' ? format(currentMonth, "MMMM") : format(currentWeek, "MMM d")}
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold tracking-tight"
            >
                {viewMode === 'monthly' ? format(currentMonth, "MMMM") : format(currentWeek, "MMM d")}
            </motion.p>
            <div className="flex items-center space-x-2 z-10">
                <button 
                    onClick={viewMode === 'monthly' ? handlePrevMonth : handlePrevWeek} 
                    className="p-1 rounded-full text-white/70 transition-colors hover:bg-black/20"
                    type="button"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                    onClick={viewMode === 'monthly' ? handleNextMonth : handleNextWeek} 
                    className="p-1 rounded-full text-white/70 transition-colors hover:bg-black/20"
                    type="button"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>

        {/* Calendar Grid */}
        <div className={`${viewMode === 'monthly' ? 'overflow-x-auto scrollbar-hide -mx-5 px-5' : 'overflow-x-auto scrollbar-hide -mx-5 px-5'}`}>
            <div className={`${viewMode === 'monthly' ? 'grid grid-cols-7 gap-1' : 'flex space-x-4'}`}>
                {(() => {
                    const daysToShow = viewMode === 'monthly' ? monthDays : weekDays;
                    console.log('View mode:', viewMode, 'Days count:', daysToShow.length);
                    return daysToShow;
                })().map((day) => (
                    <div key={format(day.date, "yyyy-MM-dd")} className={`${viewMode === 'monthly' ? 'flex flex-col items-center justify-center min-h-[60px]' : 'flex flex-col items-center space-y-2 flex-shrink-0'}`}>
                        {viewMode === 'monthly' && (
                            <span className="text-xs font-bold text-white/50 mb-1">
                                {format(day.date, "E").charAt(0)}
                            </span>
                        )}
                        <button
                            onClick={() => handleDateClick(day.date)}
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 relative",
                                {
                                    "bg-white/20 backdrop-blur-sm text-white shadow-lg border border-white/30": day.isSelected,
                                    "hover:bg-white/20": !day.isSelected,
                                    "text-white": !day.isSelected,
                                }
                            )}
                        >
                            {day.isToday && !day.isSelected && (
                                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-pink-400"></span>
                            )}
                            {getDate(day.date)}
                        </button>
                        {viewMode === 'weekly' && (
                            <span className="text-xs font-bold text-white/50">
                                {format(day.date, "E").charAt(0)}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
        
      </div>
    );
  }
);

GlassCalendar.displayName = "GlassCalendar";
