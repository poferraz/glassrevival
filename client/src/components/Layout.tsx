import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import GlassCard from "./GlassCard";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, User, Calendar, LibraryBig, Upload } from "lucide-react";
import { Link, useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export default function Layout({ children, className }: LayoutProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [location] = useLocation();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    console.log('Dark mode toggled:', !darkMode);
  };

  const navigationItems = [
    { path: '/', label: 'Calendar', icon: Calendar },
    { path: '/sessions', label: 'Sessions', icon: LibraryBig },
    { path: '/import', label: 'Import', icon: Upload },
  ];

  const isActivePath = (path: string) => {
    return location === path || (path !== '/' && location.startsWith(path));
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
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1 mr-2">
                  {navigationItems.map(({ path, label, icon: Icon }) => (
                    <Link key={path} href={path}>
                      <Button
                        variant={isActivePath(path) ? "default" : "ghost"}
                        size="sm"
                        className={`text-white hover:text-white ${
                          isActivePath(path) ? 'bg-white/20' : ''
                        }`}
                        data-testid={`nav-${label.toLowerCase()}`}
                      >
                        <Icon className="w-4 h-4 mr-1" />
                        {label}
                      </Button>
                    </Link>
                  ))}
                </div>

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
                <Link href="/sessions">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-white hover:text-white"
                    onClick={() => setShowMenu(false)}
                    data-testid="nav-workouts"
                  >
                    <LibraryBig className="w-4 h-4 mr-2" />
                    My Workouts
                  </Button>
                </Link>
                <Link href="/import">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-white hover:text-white"
                    onClick={() => setShowMenu(false)}
                    data-testid="nav-import"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </Button>
                </Link>
                <Link href="/">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-white hover:text-white"
                    onClick={() => setShowMenu(false)}
                    data-testid="nav-calendar"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Calendar
                  </Button>
                </Link>
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