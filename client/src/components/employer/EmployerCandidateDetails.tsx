import React from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/common";
import { useQuery } from "@tanstack/react-query";

export const EmployerCandidateDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: candidate, isLoading } = useQuery({
    queryKey: [`/api/employers/candidates/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  if (!candidate) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium mb-4">Candidate not found</h3>
            <BackButton fallback="/employer/dashboard" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <BackButton fallback="/employer/dashboard" variant="outline" size="sm" />
        <h1 className="text-3xl font-bold">Candidate Details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Professional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>Expected Salary: {candidate.expectedSalary || "-"}</div>
          <div>Skills: {Array.isArray(candidate.skills) ? candidate.skills.join(', ') : '-'}</div>
          <div>Languages: {Array.isArray(candidate.languages) ? candidate.languages.join(', ') : '-'}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployerCandidateDetails;
