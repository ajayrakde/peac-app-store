import React from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, IndianRupee } from "lucide-react";
import { BackButton } from "@/components/common";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

export const CandidateJobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const isVerified = userProfile?.candidate?.profileStatus === "verified";

  const {
    data: job,
    isLoading: jobLoading,
  } = useQuery({
    queryKey: [`/api/candidates/jobs/${id}`],
    enabled: !!id,
  });

  const {
    data: applications = [],
    isLoading: appsLoading,
  } = useQuery({
    queryKey: ["/api/candidates/applications"],
  });

  const isLoading = jobLoading || appsLoading;

  const [applied, setApplied] = React.useState<boolean>(() =>
    Array.isArray(applications)
      ? applications.some((a: any) => a.jobPostId === Number(id))
      : false,
  );

  React.useEffect(() => {
    if (Array.isArray(applications)) {
      setApplied(applications.some((a: any) => a.jobPostId === Number(id)));
    }
  }, [applications, id]);

  const applyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/candidates/jobs/${id}/apply`, "POST");
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/candidates/applications"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/candidates/jobs"] }),
      ]);
      setApplied(true);
      toast({ title: "Job applied successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleApply = () => {
    applyMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse bg-card border-border">
        <CardContent className="p-6 space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-4">
          <p className="text-muted-foreground">Job not found</p>
          <BackButton fallback="/jobs" label="Back to Jobs" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <BackButton
        fallback="/jobs"
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
      />

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{job.title}</CardTitle>
              {job.jobCode && (
                <Badge
                  variant="outline"
                  className="border-border text-xs mt-2"
                >
                  {job.jobCode}
                </Badge>
              )}
            </div>
            <Button
              onClick={handleApply}
              disabled={
                !isVerified ||
                applyMutation.isLoading ||
                appsLoading ||
                jobLoading ||
                applied
              }
              className="bg-primary hover:bg-primary-dark text-primary-foreground"
            >
              {applied ? "Applied" : "Apply"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{job.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                {job.salaryRange} per month
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Job Description</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {job.description || "No description provided."}
            </p>
          </div>

          {job.responsibilities && (
            <div>
              <h3 className="font-semibold mb-2">Responsibilities</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {job.responsibilities}
              </p>
            </div>
          )}

          {job.skills && (
            <div>
              <h3 className="font-semibold mb-2">Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.split(',').map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {skill.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};
