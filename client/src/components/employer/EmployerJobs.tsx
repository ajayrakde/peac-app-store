import React, { useState, useEffect, useDeferredValue } from "react";
import { useDebounce } from "@/hooks/useDebounce";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  Copy, 
  Edit, 
  Eye, 
  Users, 
  MapPin, 
  Calendar, 
  Clock,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, throwIfResNotOk } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatDistanceToNow } from "date-fns";
import { getJobStatus, canPerformAction } from "@shared/utils/jobStatus";

interface Job {
  id: number;
  title: string;
  description: string;
  minQualification: string;
  experienceRequired: string;
  skills: string;
  responsibilities: string;
  vacancy: number;
  location: string;
  salaryRange: string;
  jobCode: string;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
  status?: 'active' | 'pending' | 'onHold' | 'dormant' | 'fulfilled' | 'deleted';
}

export const EmployerJobs: React.FC = () => {
  const [, setLocation] = useLocation();
  const { userProfile } = useAuth();
  const isVerified = userProfile?.employer?.profileStatus === "verified";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [sortBy, setSortBy] = useState("latest");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchQuery = debouncedSearchTerm.length >= 3 ? debouncedSearchTerm : "";
  
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["/api/employers/jobs"],
    enabled: !!userProfile?.employer,
  });

  const markAsFulfilledMutation = useMutation({
    mutationFn: async (jobId: number) => {
      try {
        const response = await apiRequest(`/api/employers/jobs/${jobId}/fulfill`, "PATCH");
        await throwIfResNotOk(response);
        return response.json();
      } catch (error) {
        console.error('Job fulfillment error:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      // Invalidate all employer-related queries to ensure dashboard updates
      await Promise.all([
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
      ]);
      
      toast({
        title: "Job marked as fulfilled",
        description: "The job posting has been marked as fulfilled successfully",
      });
    },
    onError: (error: any) => {
      console.error('Job fulfillment mutation error:', error);
      toast({
        title: "Failed to update job",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  const activateJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      try {
        const response = await apiRequest(`/api/employers/jobs/${jobId}/activate`, "PATCH");
        await throwIfResNotOk(response);
        return response.json();
      } catch (error) {
        console.error('Job activation error:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      // Invalidate all employer-related queries to ensure dashboard updates
      await Promise.all([
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
      ]);
      
      toast({
        title: "Job activated",
        description: "The job posting has been activated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Job activation mutation error:', error);
      toast({
        title: "Failed to activate job",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  const handleCloneJob = (job: Job) => {
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
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'onHold':
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
        return <AlertTriangle className="h-4 w-4" />;
      case 'dormant':
        return <Clock className="h-4 w-4" />;
      case 'fulfilled':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Filter and sort jobs based on search/filter/sort state
  const filteredJobs = React.useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) return [];
    let filtered = jobs.filter((job) => {
      const status = getJobStatus(job);
      const matchesSearch = job.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        job.jobCode?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesFilter = filterStatus === "all" || status === filterStatus;
      return matchesSearch && matchesFilter;
    });
    filtered.sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'applications') {
        return (b.applicationsCount || 0) - (a.applicationsCount || 0);
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
    return filtered;
  }, [jobs, debouncedSearchTerm, filterStatus, sortBy, getJobStatus]);

  // Memoized Job List (dumb component, only renders jobs)
  const EmployerJobList = React.memo(function EmployerJobList({
    jobs,
    isVerified,
    getJobStatus,
    getStatusColor,
    getStatusIcon,
    handleCloneJob,
    markAsFulfilledMutation,
    activateJobMutation
  }) {
    if (!jobs.length) return null;
    return (
      <div className="space-y-4">
        {jobs.map((job) => {
          const status = getJobStatus(job);
          const getCardClassName = (status) => {
            let baseClasses = "border-border transition-colors";
            if (status === 'fulfilled') {
              baseClasses += " bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30";
            } else if (status === 'dormant' || status === 'onHold' || status === 'pending') {
              baseClasses += " bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30";
            } else {
              baseClasses += " bg-card hover:bg-accent/50 dark:hover:bg-accent/20";
            }
            return baseClasses;
          };
          return (
            <JobCard
              key={job.id}
              job={{ title: job.title }}
              detailItems={[
                job.jobCode,
                job.minQualification,
                job.experienceRequired,
                job.location,
              ]}
              statusBadge={
                <Badge className={getStatusColor(status)}>
                  {getStatusIcon(status)}
                  <span className="ml-1 capitalize">{status}</span>
                </Badge>
              }
              actions={
                <div className="flex items-center gap-2 ml-4">
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
                        {canPerformAction('employer', job.jobStatus as any, 'edit', job.deleted) && (
                          <DropdownMenuItem asChild>
                            <Link href={`/jobs/${job.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Job
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleCloneJob(job)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Clone Job
                        </DropdownMenuItem>
                        {canPerformAction('employer', job.jobStatus as any, 'fulfill', job.deleted) && <DropdownMenuSeparator />}
                        {canPerformAction('employer', job.jobStatus as any, 'fulfill', job.deleted) && (
                          <DropdownMenuItem
                            onClick={() => {
                              try {
                                markAsFulfilledMutation.mutate(job.id);
                              } catch (error) {
                                console.error('Fulfillment error:', error);
                              }
                            }}
                            disabled={markAsFulfilledMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {markAsFulfilledMutation.isPending ? 'Marking...' : 'Mark as Fulfilled'}
                          </DropdownMenuItem>
                        )}
                        {canPerformAction('employer', job.jobStatus as any, 'activate', job.deleted) && (
                          <DropdownMenuItem onClick={() => activateJobMutation.mutate(job.id)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Activate Job
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              }
              >
            </JobCard>
          );
        })}
      </div>
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Posts</h1>
          <p className="text-muted-foreground">
            Manage your job postings and track applications
          </p>
        </div>
        <Link href={isVerified ? "/jobs/create?from=jobs" : undefined}>
          <Button
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
            disabled={!isVerified}
          >
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Button>
        </Link>
      </div>
      {/* Filters and Search */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search jobs by title, location, or job code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border"
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-background border-border">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="onHold">On Hold</SelectItem>
                  <SelectItem value="dormant">Dormant</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-background border-border">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="applications">Most Applications</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Jobs List */}
      {filteredJobs.length > 0 ? (
        <EmployerJobList
          jobs={filteredJobs}
          isVerified={isVerified}
          getJobStatus={getJobStatus}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          handleCloneJob={handleCloneJob}
          markAsFulfilledMutation={markAsFulfilledMutation}
          activateJobMutation={activateJobMutation}
        />
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Briefcase className="h-16 w-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm || filterStatus !== "all" ? "No jobs found" : "No job posts yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterStatus !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Start hiring by posting your first job"
              }
            </p>
            {(!searchTerm && filterStatus === "all") && (
              <Link href={isVerified ? "/jobs/create?from=jobs" : undefined}>
                <Button
                  className="bg-primary hover:bg-primary-dark text-primary-foreground"
                  disabled={!isVerified}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post Your First Job
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
      {/* Summary Stats */}
      {jobs && jobs.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>
                Showing {jobs.length} job posts
              </span>
              <div className="flex gap-4">
                <span>Active: {jobs.filter((j: Job) => getJobStatus(j) === 'active').length || 0}</span>
                <span>Pending: {jobs.filter((j: Job) => getJobStatus(j) === 'pending').length || 0}</span>
                <span>On Hold: {jobs.filter((j: Job) => getJobStatus(j) === 'onHold').length || 0}</span>
                <span>Dormant: {jobs.filter((j: Job) => getJobStatus(j) === 'dormant').length || 0}</span>
                <span>Fulfilled: {jobs.filter((j: Job) => getJobStatus(j) === 'fulfilled').length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};