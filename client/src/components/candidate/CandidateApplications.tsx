import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, FileText } from "lucide-react";
import { JobCard } from "@/components/common";
import { Link } from "wouter";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";

interface Application {
  id: number;
  jobPostId: number;
  status: string;
  appliedAt: string;
  jobTitle: string;
  location: string;
  salaryRange: string;
  jobCode: string;
}

export const CandidateApplications: React.FC = () => {
  const { userProfile } = useAuth();

  const [statusFilter, setStatusFilter] = React.useState('all');

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/candidates/applications"],
    enabled: !!userProfile?.candidate,
  });

  const sortedApps = Array.isArray(applications)
    ? [...applications].sort(
        (a: any, b: any) =>
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
      )
    : [];

  const filteredApps = sortedApps.filter(app =>
    statusFilter === 'all' ? true : app.status?.toLowerCase() === statusFilter
  );

  const getApplicationStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "applied":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400";
      case "shortlisted":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400";
      case "accepted":
      case "hired":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-card border-border">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-6 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!Array.isArray(applications) || applications.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No applications yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          You haven't applied to any jobs yet. Browse available positions and start applying to find your next opportunity.
        </p>
        <Button className="bg-primary hover:bg-primary-dark text-primary-foreground">
          Browse Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Applications</h1>
          <p className="text-muted-foreground">
            Track the status of your job applications
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm border-border">
            {sortedApps.length} application{sortedApps.length !== 1 ? 's' : ''}
          </Badge>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredApps.map((application: Application) => (
          <JobCard
            key={application.id}
            job={{
              title: application.jobTitle,
              city: application.location,
              jobCode: application.jobCode,
            }}
            actions={
              <div className="flex items-center gap-2">
                {application.status && (
                  <Badge className={getApplicationStatusColor(application.status)}>
                    {application.status}
                  </Badge>
                )}
                <Link href={`/candidate/jobs/${application.jobPostId}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </Link>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
};