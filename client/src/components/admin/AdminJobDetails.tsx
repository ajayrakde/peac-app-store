import React from "react";
import { useParams, Link } from "wouter";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getJobStatus } from "@shared/utils/jobStatus";
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
  Building,
  MoreVertical,
  Edit,
  Trash,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  Mail,
  Phone,
} from "lucide-react";
import { BackButton } from "@/components/common";
import type { JobPost, Application, Employer } from "@shared/types";
import { formatDistanceToNow } from "date-fns";

export const AdminJobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: job, isLoading } = useQuery<JobPost>({
    queryKey: [`/api/admin/jobs/${id}`],
    enabled: !!id,
  });

  const { data: employer } = useQuery<Employer>({
    queryKey: job ? [`/api/admin/employers/${job.employerId}`] : [],
    enabled: !!job?.employerId,
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery<Application[]>({
    queryKey: [`/api/admin/jobs/${id}/applications`],
    enabled: !!id,
  });

  const fulfillMutation = useMutation({
    mutationFn: () => apiRequest(`/api/admin/jobs/${id}/fulfill`, "PATCH"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/jobs/${id}`] });
      toast({ title: "Success", description: "Job marked as fulfilled" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(`/api/admin/jobs/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      setLocation("/admin/dashboard");
      toast({ title: "Deleted", description: "Job deleted" });
    },
  });
      
  if (isLoading || appsLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="animate-pulse bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Job not found</h3>
            <BackButton fallback="/admin/dashboard" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "fulfilled":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400";
      case "active":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400";
      case "onHold":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400";
      case "dormant":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "onHold":
        return <AlertTriangle className="h-4 w-4" />;
      case "dormant":
        return <Clock className="h-4 w-4" />;
      case "fulfilled":
        return <Briefcase className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "applied":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400";
      case "reviewed":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400";
      case "shortlisted":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400";
      case "interviewed":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400";
      case "hired":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <BackButton fallback="/admin/dashboard" variant="outline" size="sm" />
        <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
        <Badge className={getStatusColor(getJobStatus(job))}>
          {getStatusIcon(getJobStatus(job))}
          <span className="ml-1 capitalize">{getJobStatus(job)}</span>
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/jobs/${job.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Job
              </Link>
            </DropdownMenuItem>
            {getJobStatus(job) !== 'fulfilled' && (
              <DropdownMenuItem onClick={() => fulfillMutation.mutate()} disabled={fulfillMutation.isPending}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {fulfillMutation.isPending ? 'Marking...' : 'Mark as Fulfilled'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              <Trash className="h-4 w-4 mr-2" />
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Job'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Employer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-semibold">{employer?.organizationName}</div>
              <div className="text-sm text-muted-foreground">{employer?.contactEmail}</div>
              <div className="text-sm text-muted-foreground">{employer?.contactPhone}</div>
            </CardContent>
          </Card>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Applications ({applications.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((application: any) => (
                <div
                  key={application.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {application.candidateName?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{application.candidateName || 'Anonymous Candidate'}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Applied {formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true })}
                        </div>
                        {application.candidateEmail && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {application.candidateEmail}
                          </div>
                        )}
                        {application.candidatePhone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {application.candidatePhone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge className={getApplicationStatusColor(application.status)}>
                    {application.status || 'Applied'}
                  </Badge>
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
    </div>
  );
};
