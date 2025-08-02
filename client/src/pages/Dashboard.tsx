import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CandidateDashboard } from "@/components/candidate/CandidateDashboard";
import { CandidateJobs } from "@/components/candidate/CandidateJobs";
import { EmployerDashboard } from "@/components/employer/EmployerDashboard";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { EmployerRegistration } from "@/components/employer/EmployerRegistration";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export const Dashboard: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-foreground" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please sign in to continue.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show employer registration if incomplete
  if (
    userProfile.role === "employer" &&
    userProfile.employer?.profileStatus !== "verified"
  ) {
    return (
      <div className="min-h-screen bg-background">
        <EmployerRegistration />
      </div>
    );
  }

  // Render appropriate dashboard based on role and route
  const renderContent = () => {
    if (userProfile.role === "candidate") {
      // For candidates: /candidate/dashboard shows dashboard, /candidate and /candidate/jobs show jobs
      if (location === "/candidate/dashboard") {
        return <CandidateDashboard />;
      } else if (location === "/candidate" || location === "/candidate/jobs" || location === "/") {
        return <CandidateJobs />;
      } else {
        return <CandidateJobs />; // Default to jobs for candidates
      }
    } else if (userProfile.role === "employer") {
      return <EmployerDashboard />;
    } else if (userProfile.role === "admin") {
      return <AdminDashboard />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
};
