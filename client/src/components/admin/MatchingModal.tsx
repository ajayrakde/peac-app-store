import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, DollarSign, Clock, Building, CheckCircle, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface MatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJob: any;
  selectedCandidate: any;
  matchingType: "job-candidates" | "candidate-jobs";
  onShortlist: (jobId: number, candidateId: number, matchScore: number) => void;
}

export const MatchingModal: React.FC<MatchingModalProps> = ({
  isOpen,
  onClose,
  selectedJob,
  selectedCandidate,
  matchingType,
  onShortlist,
}) => {
  const { data: matches, isLoading } = useQuery({
    queryKey: [
      matchingType === "job-candidates" 
        ? `/api/admin/jobs/${selectedJob?.id}/matches`
        : `/api/admin/candidates/${selectedCandidate?.id}/matches`
    ],
    enabled: isOpen && (selectedJob?.id || selectedCandidate?.id),
  });

  const title = matchingType === "job-candidates" 
    ? `Matching Candidates for ${selectedJob?.title || 'Job'}`
    : `Matching Jobs for ${selectedCandidate?.name || 'Candidate'}`;

  const renderJobCandidateMatches = () => (
    <div className="space-y-4">
      {/* Job Requirements */}
      <Card className="bg-blue-50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Job Requirements</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Required Skills:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {selectedJob?.skills?.map((skill: string) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Experience:</span>
              <div className="text-gray-900 font-medium">{selectedJob?.experienceRequired}</div>
            </div>
            <div>
              <span className="text-gray-600">Salary Range:</span>
              <div className="text-gray-900 font-medium">{selectedJob?.salaryRange}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidate Matches */}
      {matches?.map((match: any) => (
        <Card key={match.candidateId} className="border hover:border-primary transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={match.candidate.avatar} alt={match.candidate.name} />
                  <AvatarFallback>
                    {match.candidate.name?.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {match.candidate.name}
                  </h3>
                  <p className="text-gray-600">{match.candidate.role || 'Professional'}</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="text-sm text-gray-500 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {typeof match.candidate.location === 'object' 
                        ? match.candidate.location.city || 'Location'
                        : match.candidate.location || 'Location'}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {typeof match.candidate.experience === 'object'
                        ? `${match.candidate.experience.years || 0} years exp`
                        : `${match.candidate.experience || 0} years exp`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl font-bold text-green-600">
                    {match.score}%
                  </span>
                  <span className="text-sm text-gray-500">match</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onShortlist(selectedJob.id, match.candidateId, match.score)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Shortlist
                  </Button>
                </div>
              </div>
            </div>

            {/* Skills Match */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Skills Match:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {match.skillsMatch?.map((skill: any) => {
                      // Make sure skill is not an object, or extract the name if it is
                      const skillName = typeof skill === 'string' ? skill : skill.name;
                      const matches = typeof skill === 'string' ? true : skill.matches;
                      
                      return (
                        <Badge
                          key={skillName}
                          variant={matches ? "default" : "outline"}
                          className="text-xs"
                        >
                          {skillName} {matches && "✓"}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Experience:</span>
                  <div className={`font-medium ${
                    match.experienceMatch ? "text-green-600" : "text-yellow-600"
                  }`}>
                    {typeof match.candidate.experience === 'object' 
                      ? `${match.candidate.experience.years || 0} years` 
                      : `${match.candidate.experience} years`} 
                    ({match.experienceMatch ? "Perfect" : "Good"})
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Salary Expectation:</span>
                  <div className={`font-medium ${
                    match.salaryMatch ? "text-green-600" : "text-yellow-600"
                  }`}>
                    ₹{match.candidate.expectedSalary} LPA ({match.salaryMatch ? "Perfect" : "Good"})
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderCandidateJobMatches = () => (
    <div className="space-y-4">
      {/* Candidate Profile */}
      <Card className="bg-purple-50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Candidate Profile</h3>
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={selectedCandidate?.avatar} alt={selectedCandidate?.name} />
              <AvatarFallback>
                {selectedCandidate?.name?.split(" ").map((n: string) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{selectedCandidate?.name}</h4>
              <p className="text-sm text-gray-600">{selectedCandidate?.role}</p>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-gray-500">{selectedCandidate?.experience} years exp</span>
                <span className="text-sm text-gray-500">₹{selectedCandidate?.expectedSalary} LPA expected</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Matches */}
      {matches?.map((match: any) => (
        <Card key={match.jobId} className="border hover:border-primary transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {match.job.title}
                  </h3>
                  <p className="text-gray-600">{match.job.company}</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="text-sm text-gray-500 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {match.job.location}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {match.job.salaryRange}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl font-bold text-green-600">
                    {match.score}%
                  </span>
                  <span className="text-sm text-gray-500">match</span>
                </div>
                <Button variant="outline" size="sm">
                  View Job Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold">
              AI Matching Results
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-gray-600">{title}</p>
        </DialogHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-2">Finding matches...</p>
            </div>
          ) : (
            <>
              {matchingType === "job-candidates" 
                ? renderJobCandidateMatches() 
                : renderCandidateJobMatches()
              }
              
              {(!matches || matches.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p>No matches found.</p>
                </div>
              )}
            </>
          )}
        </div>

        {matches && matches.length > 0 && (
          <div className="mt-6 flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{matches.length}</span> matches
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                Export Results
              </Button>
              {matchingType === "job-candidates" && (
                <Button>
                  Shortlist Selected
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
