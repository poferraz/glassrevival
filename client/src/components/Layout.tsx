import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import GlassCard from "./GlassCard";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, User } from "lucide-react";
import { useState } from "react";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export default function Layout({ children, className }: LayoutProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    console.log('Dark mode toggled:', !darkMode);
  };

  return (
    <div className={cn("min-h-screen", darkMode ? "dark" : "")}>
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-950" />
      
      {/* Content Container */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 p-4 pb-0">
          <GlassCard variant="secondary" className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowMenu(!showMenu)}
                  className="md:hidden text-white hover:text-white"
                  data-testid="menu-button"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-bold text-white" data-testid="app-title">
                  FitTracker
                </h1>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleDarkMode}
                  className="text-white hover:text-white"
                  data-testid="theme-toggle"
                >
                  {darkMode ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:text-white"
                  data-testid="user-menu"
                >
                  <User className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </GlassCard>
        </header>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="fixed inset-x-4 top-20 z-40 md:hidden animate-slide-up">
            <GlassCard variant="primary">
              <div className="p-4 space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-white hover:text-white"
                  onClick={() => {
                    setShowMenu(false);
                    console.log('Navigate to workouts');
                  }}
                  data-testid="nav-workouts"
                >
                  My Workouts
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-white hover:text-white"
                  onClick={() => {
                    setShowMenu(false);
                    console.log('Navigate to import');
                  }}
                  data-testid="nav-import"
                >
                  Import CSV
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-white hover:text-white"
                  onClick={() => {
                    setShowMenu(false);
                    console.log('Navigate to settings');
                  }}
                  data-testid="nav-settings"
                >
                  Settings
                </Button>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Main Content */}
        <main 
          className={cn(
            "container mx-auto px-4 py-6 pb-20",
            "safe-area-inset-top safe-area-inset-bottom",
            className
          )}
        >
          {children}
        </main>

        {/* Safe Area Bottom Padding for iOS */}
        <div className="h-safe-bottom bg-transparent" />
      </div>
    </div>
  );
}