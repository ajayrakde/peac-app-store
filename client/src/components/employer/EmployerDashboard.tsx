import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Building, 
  Briefcase, 
  Users, 
  Eye, 
  TrendingUp, 
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Edit,
  Copy,
  RotateCcw
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiRequest, throwIfResNotOk } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getJobStatus } from "@shared/utils/jobStatus";

export const EmployerDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const isVerified = userProfile?.employer?.profileStatus === "verified";
  const [selectedCard, setSelectedCard] = useState<string>("recent");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCloneJob = (job: any) => {
    const cloneData = {
      title: `Copy of ${job.title}`,
      description: job.description,
      minQualification: job.minQualification,
      experienceRequired: job.experienceRequired,
      skills: job.skills,
      salaryRange: job.salaryRange,
      location: job.location,
      responsibilities: job.responsibilities,
      vacancy: job.vacancy,
    };
    
    setLocation(`/jobs/create?clone=${encodeURIComponent(JSON.stringify(cloneData))}&from=dashboard`);
  };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/employers/stats"],
    enabled: !!userProfile?.employer,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: recentJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/employers/recent-jobs"],
    enabled: !!userProfile?.employer,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: allJobs } = useQuery({
    queryKey: ["/api/employers/jobs"],
    enabled: !!userProfile?.employer,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: allApplications } = useQuery({
    queryKey: ["/api/employers/applications"],
    enabled: !!userProfile?.employer,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: fulfilledJobs } = useQuery({
    queryKey: ["/api/employers/fulfilled-jobs"],
    enabled: !!userProfile?.employer,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const markAsFulfilledMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await apiRequest(`/api/employers/jobs/${jobId}/fulfill`, "PATCH");
      await throwIfResNotOk(response);
      return response.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/employers/jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/recent-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/fulfilled-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/stats"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/applications"] }),
      ]);

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/employers/stats"] }),
        queryClient.refetchQueries({ queryKey: ["/api/employers/recent-jobs"] }),
        queryClient.refetchQueries({ queryKey: ["/api/employers/jobs"] }),
      ]);

      toast({
        title: "Job marked as fulfilled",
        description: "The job posting has been marked as fulfilled successfully",
      });
    },
    onError: (error: any) => {
      console.error("Job fulfillment mutation error:", error);
      toast({
        title: "Failed to update job",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsFulfilled = (jobId: number) => {
    markAsFulfilledMutation.mutate(jobId);
  };

  if (statsLoading || jobsLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-card border-border">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const dashboardCards = [
    {
      title: "Post New Job",
      description: "Create a new job posting",
      icon: Plus,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      href: isVerified ? "/jobs/create" : undefined,
      disabled: !isVerified,
      type: "action",
    },
    {
      title: "Active Job Posts",
      value: stats?.activeJobs || 0,
      icon: Briefcase,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      type: "stat",
      onClick: () => setSelectedCard("active-jobs")
    },
    {
      title: "Total Applications",
      value: stats?.totalApplications || 0,
      icon: Users,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      type: "stat",
      onClick: () => setSelectedCard("applications")
    },
    {
      title: "Fulfilled Jobs",
      value: stats?.fulfilledJobs || 0,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      type: "stat",
      onClick: () => setSelectedCard("fulfilled-jobs")
    }
  ];


  const getJobStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'onhold':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
      case 'dormant':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400';
      case 'fulfilled':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'onHold':
        return <AlertCircle className="h-4 w-4" />;
      case 'dormant':
        return <Clock className="h-4 w-4" />;
      case 'fulfilled':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getActiveJobs = () => {
    if (!allJobs) return [];
    return allJobs
      .filter((job: any) => getJobStatus(job) === 'active')
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  };

  const getRecentJobs = () => {
    if (!recentJobs) return [];
    return recentJobs
      .filter((job: any) => getJobStatus(job) !== 'fulfilled')
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  };

  const getCardContent = () => {
    switch (selectedCard) {
      case "active-jobs":
        const activeJobs = getActiveJobs();
        return {
          title: "Active Job Posts",
          data: activeJobs,
          emptyMessage: "No active job posts",
          emptyDescription: "Create a new job posting to start hiring"
        };
      case "applications":
        return {
          title: "Total Applications",
          data: allApplications || [],
          emptyMessage: "No applications yet",
          emptyDescription: "Applications will appear here when candidates apply"
        };
      case "fulfilled-jobs":
        return {
          title: "Fulfilled Jobs",
          data: fulfilledJobs || [],
          emptyMessage: "No fulfilled jobs yet",
          emptyDescription: "Jobs marked as fulfilled will appear here"
        };
      case "all-jobs":
        return {
          title: "All Job Posts",
          data: allJobs || [],
          emptyMessage: "No job posts yet",
          emptyDescription: "Create your first job posting"
        };
      default:
        return {
          title: "Recent Job Posts",
          data: getRecentJobs(),
          emptyMessage: "No job posts yet",
          emptyDescription: "Start hiring by posting your first job"
        };
    }
  };

  const cardContent = getCardContent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Employer Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {userProfile?.employer?.organizationName || 'Organization'}
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => {
          if (card.type === "action" && card.href) {
            return (
              <Link key={index} href={card.href}>
                <Card className={`bg-card border-border ${card.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/50 cursor-pointer'} transition-colors h-full`}>
                  <CardContent className="p-6 h-full flex items-center">
                    <div className="flex items-center w-full">
                      <div className={`p-3 rounded-full ${card.bgColor} mr-4`}>
                        <card.icon className={`h-6 w-6 ${card.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{card.title}</p>
                        <p className="text-xs text-muted-foreground">{card.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          } else {
            return (
              <Card
                key={index}
                className={`bg-card border-border h-full ${card.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/50 cursor-pointer'}`}
                onClick={card.disabled ? undefined : card.onClick}
              >
                <CardContent className="p-6 h-full flex items-center">
                  <div className="flex items-center w-full">
                    <div className={`p-3 rounded-full ${card.bgColor} mr-4`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      {card.value !== undefined ? (
                        <p className="text-2xl font-bold text-foreground">{card.value}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{card.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
        })}
      </div>

      {/* Dynamic Content Display */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">{cardContent.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {cardContent.data && cardContent.data.length > 0 ? (
            <div className="space-y-4">
              {selectedCard === "applications" ? (
                // Applications display
                cardContent.data.slice(0, 10).map((application: any) => (
                  <div key={application.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{`Candidate #${application.candidateId}`}</h3>
                        <Badge className={getJobStatusColor(application.status)}>
                          {application.status || 'pending'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs">{application.jobCode}</span>
                          <Briefcase className="h-4 w-4" />
                          {application.jobTitle}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Applied {new Date(application.appliedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/employer/candidates/${application.candidateId}`}>
                        <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                // Jobs display
                cardContent.data.slice(0, 10).map((job: any) => {
                  const status = getJobStatus(job);

                  const actions = (
                    <div className="flex gap-2 ml-4">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      {isVerified && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/jobs/${job.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Job
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCloneJob(job)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Clone Job
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {status === "active" && (
                              <DropdownMenuItem
                                onClick={() => handleMarkAsFulfilled(job.id)}
                                disabled={markAsFulfilledMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {markAsFulfilledMutation.isPending ? "Marking..." : "Mark as Fulfilled"}
                              </DropdownMenuItem>
                            )}
                            {status !== 'active' && (
                              <DropdownMenuItem>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Activate Job
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );

                  return (
                    <JobCard
                      key={job.id}
                      job={{ title: job.title }}
                      detailItems={[
                        job.jobCode,
                        job.location,
                        `${job.applicationsCount || 0} applications`,
                        job.salaryRange,
                      ]}
                      statusBadge={
                        <Badge className={getJobStatusColor(status)}>
                          {getStatusIcon(status)}
                          <span className="ml-1 capitalize">{status}</span>
                        </Badge>
                      }
                      actions={actions}
                    />
                  );
                })
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="h-16 w-16 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{cardContent.emptyMessage}</h3>
              <p className="text-muted-foreground mb-4">
                {cardContent.emptyDescription}
              </p>
              <Link href={isVerified ? "/jobs/create?from=dashboard" : undefined}>
                <Button
                  className="bg-primary hover:bg-primary-dark text-primary-foreground"
                  disabled={!isVerified}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post Your First Job
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Application Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Week</span>
                <span className="font-semibold text-foreground">{stats?.thisWeekApplications || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Week</span>
                <span className="font-semibold text-foreground">{stats?.lastWeekApplications || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="font-semibold text-foreground">{stats?.thisMonthApplications || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <AlertCircle className="h-5 w-5 mr-2 text-primary" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.pendingReviews > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-400">New Applications</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">{stats.pendingReviews} applications need review</p>
                  </div>
                  <Link href="/employer/applications">
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                      Review
                    </Button>
                  </Link>
                </div>
              )}
              {stats?.dormantJobs > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div>
                    <p className="font-medium text-orange-800 dark:text-orange-400">Dormant Jobs</p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">{stats.dormantJobs} jobs need attention</p>
                  </div>
                  <Link href="/employer/jobs?filter=dormant">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                      Review
                    </Button>
                  </Link>
                </div>
              )}
              {(!stats?.pendingReviews && !stats?.dormantJobs) && (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All caught up!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
};