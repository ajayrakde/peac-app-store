import React from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getJobStatus, canPerformAction } from "@shared/utils/jobStatus";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  Calendar,
  Users,
  Briefcase,
  DollarSign,
  Eye,
  MoreVertical,
  Edit,
  Copy,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  FileText,
  Clock,
  Mail,
  Phone,
  Download
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { JobPost, Application } from "@shared/types";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { BackButton } from "@/components/common";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: job, isLoading: jobLoading } = useQuery<JobPost>({
    queryKey: [`/api/employers/jobs/${id}`],
    enabled: !!id,
  });

  const status = job ? getJobStatus(job) : undefined;

  const { data: applications = [], isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: [`/api/employers/jobs/${id}/applications`],
    enabled: !!id,
  });

  const fulfillJobMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/employers/jobs/${id}/fulfill`, "PATCH");
    },
    onSuccess: async () => {
      // Invalidate all employer-related queries to ensure dashboard updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/employers/jobs/${id}`] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/recent-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/fulfilled-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/stats"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/applications"] }),
      ]);
      
      // Force immediate refetch with await to ensure synchronous update
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/employers/stats"] }),
        queryClient.refetchQueries({ queryKey: ["/api/employers/recent-jobs"] }),
        queryClient.refetchQueries({ queryKey: ["/api/employers/jobs"] }),
        queryClient.refetchQueries({ queryKey: [`/api/employers/jobs/${id}`] }),
      ]);
      
      toast({
        title: "Job Fulfilled",
        description: "Job has been marked as fulfilled successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark job as fulfilled. Please try again.",
        variant: "destructive",
      });
    },
  });

  const activateJobMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/employers/jobs/${id}/activate`, "PATCH");
    },
    onSuccess: async () => {
      // Invalidate all employer-related queries to ensure dashboard updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/employers/jobs/${id}`] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/recent-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/fulfilled-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/stats"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/applications"] }),
      ]);
      
      // Force immediate refetch with await to ensure synchronous update
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/employers/stats"] }),
        queryClient.refetchQueries({ queryKey: ["/api/employers/recent-jobs"] }),
        queryClient.refetchQueries({ queryKey: ["/api/employers/jobs"] }),
        queryClient.refetchQueries({ queryKey: [`/api/employers/jobs/${id}`] }),
      ]);
      
      toast({
        title: "Job Activated",
        description: "Job has been activated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to activate job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFulfillJob = () => {
    fulfillJobMutation.mutate();
  };

  const handleActivateJob = () => {
    activateJobMutation.mutate();
  };

  const handleCloneJob = () => {
    if (job) {
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
      
      setLocation(`/jobs/create?clone=${encodeURIComponent(JSON.stringify(cloneData))}&from=jobs`);
    }
  };

  if (jobLoading || applicationsLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded mb-6"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Job not found</h3>
            <p className="text-muted-foreground mb-6">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <BackButton fallback="/employer/jobs" label="Back to Jobs" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400";
      case 'active':
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400";
      case 'pending':
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400";
      case 'onHold':
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400";
      case 'dormant':
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'onHold':
        return <AlertTriangle className="h-4 w-4" />;
      case 'dormant':
        return <Clock className="h-4 w-4" />;
      case 'fulfilled':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'applied':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'reviewed':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'shortlisted':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      case 'interviewed':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
      case 'hired':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton fallback="/employer/jobs" label="Back to Jobs" variant="outline" size="sm" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
            <p className="text-muted-foreground">Job Code: {job.jobCode}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">

          <Badge className={getStatusColor(getJobStatus(job))}>
            {getStatusIcon(getJobStatus(job))}
            <span className="ml-1 capitalize">{getJobStatus(job)}</span>
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {status !== 'fulfilled' ? (
                <DropdownMenuItem asChild>
                  <Link href={`/jobs/${job.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Job
                  </Link>
                </DropdownMenuItem>
              ) : null}
              {canPerformAction('employer', job.jobStatus as any, 'clone', job.deleted) && (
                <DropdownMenuItem onClick={handleCloneJob}>
                  <Copy className="h-4 w-4 mr-2" />
                  Clone Job
                </DropdownMenuItem>
              )}
              {canPerformAction('employer', job.jobStatus as any, 'fulfill', job.deleted) ? (
                <DropdownMenuItem
                  onClick={handleFulfillJob}
                  disabled={fulfillJobMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {fulfillJobMutation.isPending ? "Marking as Fulfilled..." : "Mark as Fulfilled"}
                </DropdownMenuItem>
              ) : null}
              {canPerformAction('employer', job.jobStatus as any, 'activate', job.deleted) ? (
                <DropdownMenuItem
                  onClick={handleActivateJob}
                  disabled={activateJobMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {activateJobMutation.isPending ? "Activating..." : "Activate Job"}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Salary:</span>
                  <span className="font-medium text-green-600">{job.salaryRange}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Positions:</span>
                  <span className="font-medium">{job.vacancy || 1}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Posted:</span>
                  <span className="font-medium">
                    {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Job Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {job.description || "No description provided."}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Minimum Qualification</h3>
                <p className="text-muted-foreground">{job.minQualification}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills?.split(',').map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {skill.trim()}
                    </Badge>
                  ))}
                </div>
              </div>

              {job.responsibilities && (
                <div>
                  <h3 className="font-semibold mb-2">Responsibilities</h3>
                  <div className="text-muted-foreground whitespace-pre-line">
                    {job.responsibilities}
                  </div>
                </div>
              )}

              {job.experienceRequired && (
                <div>
                  <h3 className="font-semibold mb-2">Experience Required</h3>
                  <p className="text-muted-foreground">{job.experienceRequired}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Job Statistics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Applications</span>
                <span className="font-bold text-2xl">{applications.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Views</span>
                <span className="font-bold text-2xl">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Days Active</span>
                <span className="font-bold text-2xl">
                  {Math.floor((new Date().getTime() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Applications Section - Hidden when job is fulfilled */}
      {status !== 'fulfilled' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Applications ({applications.length})
              </div>
              {applications.length > 0 && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Applications
                </Button>
              )}
            </CardTitle>
          </CardHeader>
        <CardContent>
          {applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((application: any) => (
                <div key={application.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {`#${application.candidateId}`}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{`Candidate #${application.candidateId}`}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Applied {formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true })}
                        </div>
                        {/* Personal contact details hidden for employers */}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getApplicationStatusColor(application.status)}>
                      {application.status || 'Applied'}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Shortlist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No applications yet</h3>
              <p className="text-muted-foreground">
                Applications will appear here when candidates apply for this position.
              </p>
            </div>
          )}
        </CardContent>
        </Card>
      )}
    </div>
  );
};