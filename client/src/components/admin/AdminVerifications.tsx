import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CandidateCard, EmployerCard, JobCard } from "../common/EntityCards";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, throwIfResNotOk } from "../../lib/queryClient";
import { Link } from "wouter";
import {
  Search,
  SortAsc,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  User,
  Building2,
  FileText,
  Clock
} from "lucide-react";

export const AdminVerifications: React.FC = () => {
  const [type, setType] = useState("candidate");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch pending verifications based on type
  const { data: verifications = [], isLoading } = useQuery({
    queryKey: [`/api/admin/verifications/${type}`],
    enabled: !!type,
    onError: (error: any) => {
      const message = error?.message || "Failed to fetch verifications";
      if (typeof message === 'string' && message.toLowerCase().includes('unauthorized')) {
        toast({
          title: 'Unauthorized',
          description: 'You are not authorized to view this content.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      }
    },
  });

  // Mutations for verification actions
  const verifyMutation = useMutation({
    mutationFn: async ({ id, type, action }: { id: number; type: string; action: 'approve' | 'reject' | 'hold' }) => {
      const response = await apiRequest(`/api/admin/${type}s/${id}/${action}`, "PATCH");
      await throwIfResNotOk(response);
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/verifications/${variables.type}`] });
      toast({
        title: "Success",
        description:
          variables.action === 'approve'
            ? `${variables.type} approved successfully`
            : variables.action === 'reject'
            ? `${variables.type} rejected successfully`
            : `${variables.type} put on hold`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process verification",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: string }) => {
      const res = await apiRequest(`/api/admin/${type}s/${id}`, 'DELETE');
      await throwIfResNotOk(res);
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/verifications/${vars.type}`] });
      toast({ title: 'Deleted' });
    },
    onError: () => toast({ title: 'Failed', variant: 'destructive' })
  });

  // Helper function to format dates
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Card renderer based on type
  const renderCard = (item: any) => {
    const isCandidate = type === "candidate";
    const isEmployer = type === "employer";
    const isJob = type === "job";

    const id = isCandidate
      ? item.candidate?.id
      : isEmployer
      ? item.employer?.id
      : item.id;

    const viewLink = isCandidate
      ? `/admin/candidates/${id}`
      : isEmployer
      ? `/admin/employers/${id}`
      : `/admin/jobs/${id}`;

    const editLink = isCandidate
      ? `/admin/candidates/${id}/edit`
      : isEmployer
      ? `/admin/employers/${id}/edit`
      : `/admin/jobs/${id}/edit`;

    const name = isCandidate
      ? item.user?.name
      : isEmployer
      ? item.employer?.organizationName
      : item.title;

    const email = isCandidate
      ? item.user?.email
      : isEmployer
      ? item.user?.email
      : undefined;

    const qualification = isCandidate
      ? item.candidate?.qualifications?.[0]?.degree
      : undefined;

    const experience = isCandidate
      ? item.candidate?.experience?.[0]?.position
      : undefined;

    const industry = isEmployer ? item.employer?.businessType : undefined;
    const registration = isEmployer ? item.employer?.registrationNumber : undefined;

    const actions = (
      <div className="flex items-center gap-2">
        <Link href={viewLink}>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => verifyMutation.mutate({ id, type, action: 'approve' })}>
              <CheckCircle className="h-4 w-4 mr-2" /> Verify
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => verifyMutation.mutate({ id, type, action: 'hold' })}>
              <Clock className="h-4 w-4 mr-2" /> Hold
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={editLink}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteMutation.mutate({ id, type })} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );


    if (isCandidate) {
      return (
        <CandidateCard
          key={id}
          candidate={{
            fullName: name,
            qualification,
            experience,
            city: item.candidate?.address?.city,
          }}
          actions={actions}
        >  
        </CandidateCard>
      );
    }

    if (isEmployer) {
      return (
        <EmployerCard
          key={id}
          employer={{
            organizationName: name,
            registrationNumber: registration,
            industry,
            city: item.employer?.address,
          }}
          actions={actions}
        >
          
        </EmployerCard>
      );
    }

    return (
      <JobCard
        key={id}
        job={{
          title: name,
          positions: item.vacancy,
          qualification: item.minQualification,
          experience: item.experienceRequired,
          city: item.location,
          jobCode: item.jobCode,
          postedOn: formatDate(item.createdAt),
        }}
        actions={actions}
      >
      </JobCard>
    );
  };

  return (
    <div className="space-y-6">


      {/* Top Bar Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Tabs value={type} onValueChange={setType} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="candidate">Candidates</TabsTrigger>
            <TabsTrigger value="employer">Employers</TabsTrigger>
            <TabsTrigger value="job">Job Posts</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex-1 w-full md:w-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10 bg-background border-border"
            placeholder="Search pending verifications..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SortAsc className="h-4 w-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSort("latest")}>Latest First</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSort("oldest")}>Oldest First</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Verification List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading verifications...</p>
          </div>
        ) : verifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                No pending verifications for {type}s at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          verifications.map(renderCard)
        )}
      </div>
    </div>
  );
};
