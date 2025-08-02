import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobCard } from "@/components/common";
import {
  Eye,
  Send,
  CheckCircle,
  Trophy,
  MapPin,
  DollarSign,
  Clock,
  Building,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { subDays, isAfter } from "date-fns";
import { Link } from "wouter";

export const CandidateDashboard: React.FC = () => {
  const { userProfile } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/candidates/stats"],
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["/api/candidates/applications"],
    enabled: !!userProfile?.candidate,
  });

  const appliedJobs = Array.isArray(applications) ? applications : [];
  const shortlistedJobs = appliedJobs.filter(
    (app: any) => app.status === "shortlisted"
  );

  const recentApplications = Array.isArray(applications)
    ? applications.filter((app: any) =>
        isAfter(new Date(app.appliedAt), subDays(new Date(), 30))
      )
    : [];

  if (!userProfile) return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {userProfile.name}!
          </h1>
          <p className="text-muted-foreground">
            Discover new opportunities and manage your job applications
          </p>
        </div>
        <Link href="/candidate/profile/edit">
          <Button className="bg-primary hover:bg-primary-dark text-primary-foreground">
            My Profile
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="bg-card border-border opacity-50 cursor-not-allowed">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Profile Views</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats?.profileViews || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>Coming Soon</TooltipContent>
        </Tooltip>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Applications</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.applications || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shortlisted</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.shortlisted || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="bg-card border-border opacity-50 cursor-not-allowed">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Match Score</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats?.matchScore || 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>Coming Soon</TooltipContent>
        </Tooltip>
      </div>

      {/* Applied Jobs */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Applied Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appliedJobs.map((app: any) => (
              <JobCard
                key={app.id}
                job={{
                  title: app.jobTitle,
                  city: app.location,
                  jobCode: app.jobCode,
                }}
                actions={
                  <Link href={`/candidate/jobs/${app.jobPostId}`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </Link>
                }
              />
            ))}

            {appliedJobs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="h-12 w-12 mx-auto mb-4 text-muted" />
                <p>No job applications yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shortlisted Jobs */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Shortlisted Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shortlistedJobs.map((app: any) => (
              <JobCard
                key={app.id}
                job={{
                  title: app.jobTitle,
                  city: app.location,
                  jobCode: app.jobCode,
                }}
                actions={
                  <Link href={`/candidate/jobs/${app.jobPostId}`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </Link>
                }
              />
            ))}

            {shortlistedJobs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-4 text-muted" />
                <p>No shortlisted jobs yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Applications */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentApplications.map((app: any) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 border border-border bg-card rounded-lg hover:bg-accent/50 dark:hover:bg-accent/20 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{app.jobTitle}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      app.status === "interviewed"
                        ? "default"
                        : app.status === "shortlisted"
                        ? "secondary"
                        : "outline"
                    }
                    className="border-border"
                  >
                    {app.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{app.appliedAt}</p>
                </div>
              </div>
            ))}

            {recentApplications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="h-12 w-12 mx-auto mb-4 text-muted" />
                <p>No applications yet. Start applying to jobs!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
