import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Building, MapPin, DollarSign, Clock, User, Briefcase } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MatchingModal } from "./MatchingModal";
import { Link } from "wouter";

export const MatchingEngine: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [matchingType, setMatchingType] = useState<"job-candidates" | "candidate-jobs">("job-candidates");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs } = useQuery({
    queryKey: ["/api/admin/jobs"],
  });

  const { data: candidates } = useQuery({
    queryKey: ["/api/admin/active-candidates"],
  });

  const shortlistMutation = useMutation({
    mutationFn: (data: { jobPostId: number; candidateId: number; matchScore: number }) =>
      apiRequest("/api/admin/shortlist", "POST", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Candidate shortlisted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shortlists"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to shortlist candidate.",
        variant: "destructive",
      });
    },
  });


  const handleCandidateClick = (candidate: any) => {
    setSelectedCandidate(candidate);
    setMatchingType("candidate-jobs");
    setShowMatchingModal(true);
  };

  const handleShortlist = (jobId: number, candidateId: number, matchScore: number) => {
    shortlistMutation.mutate({
      jobPostId: jobId,
      candidateId: candidateId,
      matchScore: matchScore,
    });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Jobs with Matching Candidates */}
      <Card>
        <CardHeader>
          <CardTitle>Active Jobs</CardTitle>
          <p className="text-sm text-gray-600">
            Click on a job to find matching candidates
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs?.map((job: any) => (
              <Link key={job.id} href={`/admin/jobs/${job.id}`}>
                <div
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.company?.name || 'Company Name'}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        {job.location?.city || job.location || 'Location'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {job.salaryRange || 'Salary range'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {job.matchCount || 0}
                    </div>
                    <div className="text-xs text-gray-500">matches</div>
                  </div>
                </div>
                </div>
              </Link>
            ))}

            {(!jobs || jobs.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active jobs found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Candidates with Job Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Top Active Candidates</CardTitle>
          <p className="text-sm text-gray-600">
            Click on a candidate to find matching jobs
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {candidates?.map((candidate: any, index: number) => (
              <Link
                key={candidate.id ?? candidate.candidate?.id ?? index}
                href={`/candidates/${candidate.id ?? candidate.candidate?.id ?? ''}`}
              >
                <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={candidate.avatar} alt={
                        typeof candidate.name === 'object'
                          ? `${candidate.name.first || ''} ${candidate.name.last || ''}`
                          : candidate.name || 'Candidate'
                      } />
                    <AvatarFallback>
                      {typeof candidate.name === 'object'
                        ? `${(candidate.name.first?.[0] || '')}${(candidate.name.last?.[0] || '')}`
                        : (candidate.name?.split(" ").map((n: string) => n[0]).join("") || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {typeof candidate.name === 'object' 
                        ? `${candidate.name.first || ''} ${candidate.name.last || ''}`
                        : candidate.name || 'Candidate'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {typeof candidate.role === 'object'
                        ? candidate.role.title || "Professional"
                        : candidate.role || "Professional"}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {typeof candidate.experience === 'object'
                          ? `${candidate.experience.years || 0} years`
                          : `${candidate.experience || 0} years`}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        {typeof candidate.location === 'object'
                          ? candidate.location.city || 'Location'
                          : candidate.location || 'Location'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {candidate.jobMatches || 0}
                    </div>
                    <div className="text-xs text-gray-500">job matches</div>
                  </div>
                  </div>
                </div>
              </Link>
            ))}

            {(!candidates || candidates.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No candidates found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Matching Modal */}
      <MatchingModal
        isOpen={showMatchingModal}
        onClose={() => setShowMatchingModal(false)}
        selectedJob={selectedJob}
        selectedCandidate={selectedCandidate}
        matchingType={matchingType}
        onShortlist={handleShortlist}
      />
    </div>
  );
};
