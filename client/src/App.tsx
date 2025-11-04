import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Lazy load all pages for better code splitting
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewProject = lazy(() => import("./pages/NewProject"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Templates = lazy(() => import("./pages/Templates"));
const Settings = lazy(() => import("./pages/Settings"));
const ImportRepository = lazy(() => import("./pages/ImportRepository"));
const AdminCostDashboard = lazy(() => import("./pages/AdminCostDashboard"));
const AdminSecurity = lazy(() => import("./pages/AdminSecurity"));
const CostManagement = lazy(() => import("./pages/CostManagement"));
const Legal = lazy(() => import("./pages/Legal"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/templates"} component={Templates} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/projects/new"} component={NewProject} />
      <Route path={"/projects/:id"} component={ProjectDetail} />
      <Route path={"/import"} component={ImportRepository} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/account"} component={AccountSettings} />
      <Route path={"/cost-management"} component={CostManagement} />
      <Route path={"/admin/costs"} component={AdminCostDashboard} />
      <Route path={"/admin/security"} component={AdminSecurity} />
      <Route path={"/legal"} component={Legal} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
