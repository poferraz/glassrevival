import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Calendar from "@/pages/Calendar";
import Sessions from "@/pages/Sessions";
import WorkoutMode from "@/pages/WorkoutMode";
import Import from "@/pages/Import";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Calendar} />
      <Route path="/sessions" component={Sessions} />
      <Route path="/import" component={Import} />
      <Route path="/workout/:sessionId" component={WorkoutMode} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout>
          <Router />
        </Layout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
