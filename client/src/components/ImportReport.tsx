import GlassCard from "./GlassCard";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Info, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportStats {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  unitCounts: {
    reps: number;
    seconds: number;
    steps: number;
  };
  malformedTokens: string[];
  parsingTime: number;
}

interface ImportReportProps {
  stats: ImportStats;
  filename: string;
  onClose?: () => void;
}

export default function ImportReport({ stats, filename, onClose }: ImportReportProps) {
  const successRate = Math.round((stats.validRows / stats.totalRows) * 100);
  
  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    variant = "default" 
  }: { 
    icon: any, 
    label: string, 
    value: string | number, 
    variant?: "default" | "success" | "warning" | "error" 
  }) => {
    const variantStyles = {
      default: "text-white/90",
      success: "text-green-400",
      warning: "text-yellow-400", 
      error: "text-red-400"
    };

    return (
      <div className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5", variantStyles[variant])} />
        <div>
          <div className="text-white/75 text-sm">{label}</div>
          <div className={cn("font-mono font-semibold text-lg", variantStyles[variant])}>
            {value}
          </div>
        </div>
      </div>
    );
  };

  return (
    <GlassCard variant="primary" className="animate-slide-up">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1" data-testid="import-report-title">
              Import Report
            </h3>
            <p className="text-white/75 text-sm" data-testid="import-filename">
              {filename}
            </p>
          </div>
          <div className="text-right">
            <div className={cn(
              "text-2xl font-bold",
              successRate >= 90 ? "text-green-400" : 
              successRate >= 70 ? "text-yellow-400" : "text-red-400"
            )} data-testid="success-rate">
              {successRate}%
            </div>
            <div className="text-white/60 text-xs">Success Rate</div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-6">
          <StatCard 
            icon={BarChart3}
            label="Total Rows"
            value={stats.totalRows}
            variant="default"
          />
          <StatCard 
            icon={CheckCircle}
            label="Valid Rows" 
            value={stats.validRows}
            variant="success"
          />
        </div>

        {/* Unit Distribution */}
        <div>
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Exercise Unit Distribution
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <Badge variant="secondary" className="w-full justify-center py-2">
                <div>
                  <div className="font-mono font-semibold text-lg" data-testid="reps-count">
                    {stats.unitCounts.reps}
                  </div>
                  <div className="text-xs opacity-75">Reps</div>
                </div>
              </Badge>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="w-full justify-center py-2">
                <div>
                  <div className="font-mono font-semibold text-lg" data-testid="seconds-count">
                    {stats.unitCounts.seconds}
                  </div>
                  <div className="text-xs opacity-75">Seconds</div>
                </div>
              </Badge>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="w-full justify-center py-2">
                <div>
                  <div className="font-mono font-semibold text-lg" data-testid="steps-count">
                    {stats.unitCounts.steps}
                  </div>
                  <div className="text-xs opacity-75">Steps</div>
                </div>
              </Badge>
            </div>
          </div>
        </div>

        {/* Parsing Issues */}
        {stats.malformedTokens.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Parsing Issues ({stats.malformedTokens.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {stats.malformedTokens.slice(0, 5).map((token, index) => (
                <div 
                  key={index}
                  className="bg-white/10 rounded-lg p-2 text-white/80 text-sm font-mono"
                  data-testid={`malformed-token-${index}`}
                >
                  "{token}"
                </div>
              ))}
              {stats.malformedTokens.length > 5 && (
                <div className="text-white/60 text-sm text-center">
                  +{stats.malformedTokens.length - 5} more issues
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <div className="text-white/60 text-sm">
            Parsed in {stats.parsingTime}ms
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
              data-testid="close-report-button"
            >
              Close Report
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}