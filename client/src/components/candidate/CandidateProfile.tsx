import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { DocumentList } from "@/components/common/DocumentList";
import { listDocuments } from "@/lib/documentApi";
import { Link } from "wouter";

export const CandidateProfile: React.FC = () => {
  const { userProfile } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["/api/candidates/profile"],
    enabled: !!userProfile?.id,
  });
  const { data: docs } = useQuery({
    queryKey: ["/api/candidates/documents"],
    queryFn: () => listDocuments('candidate'),
    enabled: !!userProfile?.id,
  });
  const [section, setSection] = useState("personal");

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-card border-border">
            <CardContent className="p-6 h-20" />
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profile information not found.</p>
      </div>
    );
  }

  const candidate = data as any;

  const navItems = [
    { id: "personal", label: "Personal Details" },
    { id: "qualifications", label: "Qualifications" },
    { id: "experience", label: "Experience" },
    { id: "skills", label: "Skills" },
    { id: "documents", label: "Documents" },
  ];

  return (
    <div className="flex gap-6">
      <div className="w-48">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={section === item.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-1"
                onClick={() => setSection(item.id)}
              >
                {item.label}
              </Button>
            ))}
            {candidate.profileStatus !== "pending" && (
              <Link href="/candidate/profile/edit">
                <Button variant="outline" className="w-full mt-4">
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 space-y-6">
        {section === "personal" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium text-foreground">
                  {candidate.dateOfBirth
                    ? new Date(candidate.dateOfBirth).toLocaleDateString()
                    : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium text-foreground">
                  {candidate.gender || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marital Status</p>
                <p className="font-medium text-foreground">
                  {candidate.maritalStatus || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dependents</p>
                <p className="font-medium text-foreground">
                  {candidate.dependents || 0}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium text-foreground">
                  {candidate.address || "Not specified"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Emergency Contact</p>
                <p className="font-medium text-foreground">
                  {candidate.emergencyContact || "Not specified"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {section === "qualifications" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Qualifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidate.qualifications && candidate.qualifications.length > 0 ? (
                candidate.qualifications.map((q: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-muted/30 border border-border rounded-lg"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Degree</p>
                        <p className="font-medium text-foreground">
                          {q.degree || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Institution</p>
                        <p className="font-medium text-foreground">
                          {q.institution || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Year</p>
                        <p className="font-medium text-foreground">
                          {q.year || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Percentage/GPA</p>
                        <p className="font-medium text-foreground">
                          {q.percentage || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground py-3">No qualifications added</p>
              )}
            </CardContent>
          </Card>
        )}

        {section === "experience" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Work Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidate.experience && candidate.experience.length > 0 ? (
                candidate.experience.map((exp: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-muted/50 dark:bg-muted/20 rounded-lg border border-border"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p className="font-medium text-foreground">
                          {exp.company || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Position</p>
                        <p className="font-medium text-foreground">
                          {exp.position || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium text-foreground">
                          {exp.duration || "Not specified"}
                        </p>
                      </div>
                    </div>
                    {exp.description && (
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="font-medium text-foreground">
                          {exp.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground py-3">No work experience added</p>
              )}
            </CardContent>
          </Card>
        )}

        {section === "skills" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Skills</p>
                <p className="font-medium text-foreground">
                  {candidate.skills && candidate.skills.length > 0
                    ? candidate.skills.join(", ")
                    : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Languages</p>
                <p className="font-medium text-foreground">
                  {candidate.languages && candidate.languages.length > 0
                    ? candidate.languages.join(", ")
                    : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected Salary</p>
                <p className="font-medium text-foreground">
                  {candidate.expectedSalary || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Job Codes</p>
                <p className="font-medium text-foreground">
                  {candidate.jobCodes && candidate.jobCodes.length > 0
                    ? candidate.jobCodes.join(", ")
                    : "Not specified"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {section === "documents" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentList userType="candidate" docs={(docs as any)?.documents || []} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CandidateProfile;
