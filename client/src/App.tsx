import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider, useAuth } from "./components/auth/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { Navbar } from "./components/common/Navbar";
import { Chatbot } from "./components/common/Chatbot";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Admin } from "./pages/Admin";
import { CandidateApplications } from "./components/candidate/CandidateApplications";
import { CandidateProfileEdit } from "./components/candidate/CandidateProfileEdit";
import { CandidateRegistration } from "./components/candidate/CandidateRegistration";
import { CandidateProfile } from "./components/candidate/CandidateProfile";
import { EmployerRegistration } from "./components/employer/EmployerRegistration";
import { EmployerDashboard } from "./components/employer/EmployerDashboard";
import { EmployerJobs } from "./components/employer/EmployerJobs";
import { EmployerJobCreate } from "./components/employer/EmployerJobCreate";
import { EmployerJobEdit } from "./components/employer/EmployerJobEdit";
import { JobDetails } from "./components/employer/JobDetails";
import { EmployerCandidateDetails } from "./components/employer/EmployerCandidateDetails";
import { EmployerProfile } from "./components/employer/EmployerProfile";
import { AdminCandidateDetails } from "./components/admin/AdminCandidateDetails";
import { AdminJobDetails } from "./components/admin/AdminJobDetails";
import { AdminJobEdit } from "./components/admin/AdminJobEdit";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminSearchPanel } from "./components/admin/AdminSearchPanel";
import { AdminVerifications } from "./components/admin/AdminVerifications";
import { AdminTools } from "./components/admin/AdminTools";
import { AdminEmployerDetails } from "./components/admin/AdminEmployerDetails";
import { CandidateJobDetails } from "./components/candidate/CandidateJobDetails";
import NotFound from "./pages/not-found";

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { user, userProfile, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  if (roles && userProfile && !roles.includes(userProfile.role)) {
    const redirect =
      userProfile.role === "admin"
        ? "/admin/dashboard"
        : userProfile.role === "employer"
        ? "/employer/dashboard"
        : "/candidate/jobs";
    setLocation(redirect);
    return null;
  }

  return <>{children}</>;
}

function Router() {
  const { user, userProfile, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (
        location.startsWith("/candidate") ||
        location.startsWith("/employer") ||
        (location.startsWith("/admin") && location !== "/admin")
      ) {
        setLocation("/");
      }
      return;
    }

    if (!userProfile) return;

    const role = userProfile.role;
    const candidateStatus = userProfile.candidate?.profileStatus;
    const employerStatus = userProfile.employer?.profileStatus;
    const hasCandidate = !!userProfile.candidate;
    const hasEmployer = !!userProfile.employer;

    const redirectToDefault = () => {
      if (role === "admin") setLocation("/admin/dashboard");
      else if (role === "employer") setLocation("/employer/dashboard");
      else setLocation("/candidate/jobs");
    };

    if (role === "candidate") {
      if (!hasCandidate) {
        if (location !== "/candidate/register") setLocation("/candidate/register");
        return;
      }
      if (
        candidateStatus === "pending" &&
        ["/", "/dashboard", "/candidate/register"].includes(location)
      ) {
        setLocation("/candidate/jobs");
        return;
      }
      if (
        candidateStatus === "verified" &&
        ["/", "/dashboard"].includes(location)
      ) {
        setLocation("/candidate/jobs");
        return;
      }
    } else if (role === "employer") {
      if (!hasEmployer) {
        if (location !== "/employer/register") setLocation("/employer/register");
        return;
      }
      if (
        employerStatus === "pending" &&
        ["/", "/dashboard", "/employer/register"].includes(location)
      ) {
        setLocation("/employer/dashboard");
        return;
      }
      if (
        employerStatus === "verified" &&
        ["/", "/dashboard"].includes(location)
      ) {
        setLocation("/employer/dashboard");
        return;
      }
    } else if (role === "admin") {
      if (["/", "/admin"].includes(location)) {
        setLocation("/admin/dashboard");
        return;
      }
    }

    if (location.startsWith("/admin") && role !== "admin") {
      redirectToDefault();
      return;
    }
    if (location.startsWith("/candidate") && role !== "candidate") {
      redirectToDefault();
      return;
    }
    if ((location.startsWith("/employer") || location.startsWith("/jobs")) && role !== "employer") {
      redirectToDefault();
      return;
    }
  }, [user, userProfile, location, loading, setLocation]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {user && <Navbar />}
      <Switch>
        <Route path="/">
          {user && userProfile?.role === "admin" ? <AdminDashboard /> : 
           user ? <Dashboard /> : <Landing />}
        </Route>

        {/* Admin Routes */}
        <Route path="/admin">
          {user && userProfile?.role === "admin" ? <AdminDashboard /> : <Admin />}
        </Route>
        <Route path="/admin/dashboard">
          <ProtectedRoute roles={["admin"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminDashboard />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/search">
          <ProtectedRoute roles={["admin"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminSearchPanel />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/verifications">
          <ProtectedRoute roles={["admin"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminVerifications />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/tools">
          <ProtectedRoute roles={["admin"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminTools />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/jobs/:id/edit">
          <ProtectedRoute roles={["admin"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminJobEdit />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/jobs/:id">
          <ProtectedRoute roles={["admin"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminJobDetails />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/candidates/:id">
          <ProtectedRoute roles={["admin"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminCandidateDetails />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/employers/:id">
          <ProtectedRoute roles={["admin"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminEmployerDetails />
              </div>
            </div>
          </ProtectedRoute>
        </Route>

        {/* Candidate Routes */}
        <Route path="/candidate">
          <ProtectedRoute roles={["candidate"]}>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/candidate/jobs">
          <ProtectedRoute roles={["candidate"]}>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/candidate/jobs/:id">
          <ProtectedRoute roles={["candidate"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CandidateJobDetails />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/candidate/register">
          <ProtectedRoute roles={["candidate"]}>
            <CandidateRegistration />
          </ProtectedRoute>
        </Route>
        <Route path="/candidate/profile">
          <ProtectedRoute roles={["candidate"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CandidateProfile />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/candidate/applications">
          <ProtectedRoute roles={["candidate"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CandidateApplications />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/candidate/dashboard">
          <ProtectedRoute roles={["candidate","employer","admin"]}>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/candidate/profile/edit">
          <ProtectedRoute roles={["candidate"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CandidateProfileEdit />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute roles={["candidate","employer","admin"]}>
            <Dashboard />
          </ProtectedRoute>
        </Route>

        {/* Employer Routes */}
        <Route path="/employer/">
          <ProtectedRoute roles={["employer"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmployerDashboard />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/employer/dashboard">
          <ProtectedRoute roles={["employer"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmployerDashboard />
              </div>
            </div>
          </ProtectedRoute>
        </Route>

        {/* Additional Employer Routes */}
        <Route path="/employer/register">
          <ProtectedRoute roles={["employer"]}>
            <EmployerRegistration />
          </ProtectedRoute>
        </Route>
        <Route path="/employer/jobs">
          <ProtectedRoute roles={["employer"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmployerJobs />
              </div>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/jobs/create">
          <ProtectedRoute roles={["employer"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmployerJobCreate />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/jobs/:id/edit">
          <ProtectedRoute roles={["employer"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmployerJobEdit />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/jobs/:id">
          <ProtectedRoute roles={["employer","admin"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <JobDetails />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/employer/candidates/:id">
          <ProtectedRoute roles={["employer"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmployerCandidateDetails />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/candidates/:id">
          <ProtectedRoute roles={["admin"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminCandidateDetails />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/employer/profile">
          <ProtectedRoute roles={["employer"]}>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmployerProfile />
              </div>
            </div>
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
      <Chatbot />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="lokaltalent-theme">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
