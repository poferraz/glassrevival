import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "tertiary";
}

export default function GlassCard({ 
  children, 
  className, 
  onClick, 
  variant = "primary" 
}: GlassCardProps) {
  const variantClasses = {
    primary: "bg-white/30 dark:bg-white/20 border-white/30 dark:border-white/20",
    secondary: "bg-black/20 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl",
    tertiary: "bg-white/10 dark:bg-white/10 border-white/10 dark:border-white/10"
  };

  return (
    <div
      className={cn(
        "backdrop-blur-lg rounded-2xl border shadow-lg",
        "transition-all duration-300 hover-elevate",
        variantClasses[variant],
        onClick && "cursor-pointer active-elevate-2",
        className
      )}
      onClick={onClick}
      data-testid={`glass-card-${variant}`}
    >
      {children}
    </div>
  );
}