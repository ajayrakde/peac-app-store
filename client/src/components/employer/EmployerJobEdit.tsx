import React from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";
import { BackButton } from "@/components/common";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobPostSchema } from "@shared/zod";
import { apiRequest } from "@/lib/queryClient";

import { qualifications, experienceLevels } from "@shared/constants";

import { debugLog } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import { getJobStatus, canPerformAction } from "@shared/utils/jobStatus";
import { z } from "zod";

const editJobSchema = insertJobPostSchema.extend({
  title: z.string().min(1, "Job title is required"),
  minQualification: z.string().min(1, "Minimum qualification is required"),
  skills: z.string().min(1, "Skills are required"),
  responsibilities: z.string().min(1, "Responsibilities are required"),
  vacancy: z.coerce.number().min(1, "Number of positions must be at least 1"),
  employerId: z.any().optional(),
  jobCode: z.any().optional(),
});

type EditJobFormData = z.infer<typeof editJobSchema>;

export const EmployerJobEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: [`/api/employers/jobs/${id}`],
    enabled: !!id,
  });

  const form = useForm<EditJobFormData>({
    resolver: zodResolver(editJobSchema),
    defaultValues: {
      title: "",
      description: "",
      minQualification: "",
      experienceRequired: "",
      skills: "",
      salaryRange: "",
      location: "",
      responsibilities: "",
      vacancy: 1,
    },
  });

  // Update form when job data loads
  React.useEffect(() => {
    if (job) {
      form.reset({
        title: job.title || "",
        description: job.description || "",
        minQualification: job.minQualification || "",
        experienceRequired: job.experienceRequired || "",
        skills: job.skills || "",
        salaryRange: job.salaryRange || "",
        location: job.location || "",
        responsibilities: job.responsibilities || "",
        vacancy: job.vacancy || 1,
      });
    }
  }, [job, form]);

  const updateJobMutation = useMutation({
    mutationFn: (data: EditJobFormData) =>
      apiRequest(`/api/employers/jobs/${id}`, "PUT", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employers/jobs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/employers/jobs/${id}`] });
      setLocation(`/jobs/${id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update job",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditJobFormData) => {
    debugLog("onSubmit called with data:", data);
    updateJobMutation.mutate(data);
  };

  React.useEffect(() => {
    if (form.formState.errors && Object.keys(form.formState.errors).length > 0) {
      debugLog("Form validation errors:", form.formState.errors);
    }
  }, [form.formState.errors]);

  React.useEffect(() => {
    if (updateJobMutation.isError) {
      debugLog("Mutation error:", updateJobMutation.error);
    }
    if (updateJobMutation.isSuccess) {
      debugLog("Mutation success");
    }
    if (updateJobMutation.isPending) {
      debugLog("Mutation pending...");
    }
  }, [updateJobMutation.isError, updateJobMutation.isSuccess, updateJobMutation.isPending, updateJobMutation.error]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Job not found</h3>
            <p className="text-muted-foreground mb-6">
              The job you're trying to edit doesn't exist or has been removed.
            </p>
            <BackButton fallback="/employer/jobs" label="Back to Jobs" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if job is fulfilled and prevent editing
  if (!canPerformAction('employer', job.jobStatus as any, 'edit', job.deleted)) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Cannot Edit Fulfilled Job</h3>
            <p className="text-muted-foreground mb-6">
              This job has been marked as fulfilled and cannot be edited. You can clone this job to create a new posting.
            </p>
            <div className="flex gap-4 justify-center">
              <BackButton fallback="/employer/jobs" label="Back to Jobs" />
              <Button
                variant="outline"
                onClick={() => {
                  // Clone job functionality would go here
                  setLocation("/jobs/create");
                }}
              >
                Clone Job
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <BackButton fallback="/employer/jobs" label="Back to Jobs" variant="outline" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Job</h1>
          <p className="text-muted-foreground">Update job details and requirements</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  placeholder="e.g., Senior Software Engineer"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vacancy">Number of Positions *</Label>
                <Input
                  id="vacancy"
                  type="number"
                  min="1"
                  {...form.register("vacancy")}
                  placeholder="1"
                />
                {form.formState.errors.vacancy && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.vacancy.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Describe the role, company culture, and what makes this opportunity unique..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minQualification">Minimum Qualification *</Label>
              <Select
                value={form.watch("minQualification")}
                onValueChange={(value) => form.setValue("minQualification", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select minimum qualification" />
                </SelectTrigger>
                <SelectContent>
                  {qualifications.map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.minQualification && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.minQualification.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceRequired">Experience Required</Label>
              <Select
                value={form.watch("experienceRequired")}
                onValueChange={(value) => form.setValue("experienceRequired", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Required Skills *</Label>
              <Textarea
                id="skills"
                {...form.register("skills")}
                placeholder="e.g., JavaScript, React, Node.js, TypeScript (separate with commas)"
                rows={3}
              />
              {form.formState.errors.skills && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.skills.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">Key Responsibilities *</Label>
              <Textarea
                id="responsibilities"
                {...form.register("responsibilities")}
                placeholder="List the main responsibilities and duties for this role..."
                rows={4}
              />
              {form.formState.errors.responsibilities && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.responsibilities.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="salaryRange">Salary Range</Label>
                <Input
                  id="salaryRange"
                  {...form.register("salaryRange")}
                  placeholder="e.g., ₹8,00,000 - ₹12,00,000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...form.register("location")}
                  placeholder="e.g., San Francisco, CA or Remote"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={updateJobMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateJobMutation.isPending ? "Updating..." : "Update Job"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/employer/jobs")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};