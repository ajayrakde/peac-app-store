import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X, User, Briefcase, Upload, FileText, Download, GraduationCap, Plus, Minus } from "lucide-react";
import { BackButton } from "@/components/common";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useFileUpload } from "@/hooks/useFileUpload";
import { genders, maritalStatuses } from "@shared/constants";

interface CandidateData {
  id: number;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  dependents: number;
  address: string;
  emergencyContact: string;
  qualifications: any[];
  experience: any[];
  skills: string[];
  languages: string[];
  expectedSalary: number;
  jobCodes: string[];
  documents: Record<string, string>;
}

export const CandidateProfileEdit: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const { uploadFile } = useFileUpload();

  // Fetch current candidate data
  const { data: candidateData, isLoading } = useQuery({
    queryKey: ["/api/candidates/profile"],
    enabled: !!userProfile?.id,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<CandidateData>) =>
      apiRequest(`/api/candidates/${(candidateData as any)?.id}`, "PATCH", data),
    onSuccess: () => {
      toast({
        title: "Profile updated successfully",
        description: "Your profile information has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates/stats"] });
      setEditingSection(null);
      setEditData({});
      setLocation("/candidate/profile");
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const startEditing = (section: string) => {
    setEditingSection(section);
    const data = candidateData as any;
    if (section === "personal") {
      setEditData({
        dateOfBirth: data?.dateOfBirth || "",
        gender: data?.gender || "",
        maritalStatus: data?.maritalStatus || "",
        dependents: data?.dependents || 0,
        address: data?.address || "",
        emergencyContact: data?.emergencyContact || "",
      });
    } else if (section === "professional") {
      setEditData({
        skills: data?.skills || [],
        languages: data?.languages || [],
        expectedSalary: data?.expectedSalary || 0,
        jobCodes: data?.jobCodes || [],
      });
    } else if (section === "documents") {
      setEditData({
        documents: data?.documents || {},
      });
    } else if (section === "qualifications") {
      setEditData({
        qualifications: data?.qualifications || [],
      });
    } else if (section === "experience") {
      setEditData({
        experience: data?.experience || [],
      });
    }
  };

  const handleResumeUpload = async (file: File) => {
    try {
      const uploadedUrl = await uploadFile(file, `resumes/${userProfile?.id}/resume.pdf`);
      setEditData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          resume: uploadedUrl,
        },
      }));
      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been updated.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditData({});
  };

  const saveSection = () => {
    updateMutation.mutate(editData);
  };

  const handleSkillsChange = (value: string) => {
    const skillsArray = value.split(",").map(skill => skill.trim()).filter(Boolean);
    setEditData(prev => ({ ...prev, skills: skillsArray }));
  };

  const handleLanguagesChange = (value: string) => {
    const languagesArray = value.split(",").map(lang => lang.trim()).filter(Boolean);
    setEditData(prev => ({ ...prev, languages: languagesArray }));
  };

  const handleJobCodesChange = (value: string) => {
    const jobCodesArray = value.split(",").map(code => code.trim()).filter(Boolean);
    setEditData(prev => ({ ...prev, jobCodes: jobCodesArray }));
  };

  const addQualification = () => {
    const newQualification = { degree: "", institution: "", year: "", percentage: "" };
    setEditData(prev => ({
      ...prev,
      qualifications: [...(prev.qualifications || []), newQualification]
    }));
  };

  const updateQualification = (index: number, field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      qualifications: prev.qualifications.map((qual, i) => 
        i === index ? { ...qual, [field]: value } : qual
      )
    }));
  };

  const removeQualification = (index: number) => {
    setEditData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  const addExperience = () => {
    const newExperience = { company: "", position: "", duration: "", description: "" };
    setEditData(prev => ({
      ...prev,
      experience: [...(prev.experience || []), newExperience]
    }));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (index: number) => {
    setEditData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const data = candidateData as any;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BackButton
            fallback="/candidate/profile"
            variant="ghost"
            size="sm"
            className="hover:bg-accent"
            label="Back to Profile"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">Profile Overview</h1>
            <p className="text-sm text-muted-foreground">View and edit your profile information section by section</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Personal Information Section */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Personal Information</CardTitle>
            </div>
            {editingSection !== "personal" && (
              <Button variant="outline" size="sm" onClick={() => startEditing("personal")} className="border-border hover:bg-accent">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {editingSection === "personal" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={editData.dateOfBirth || ""}
                      onChange={(e) => setEditData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={editData.gender || ""} onValueChange={(value) => setEditData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {genders.map((g) => (
                          <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select value={editData.maritalStatus || ""} onValueChange={(value) => setEditData(prev => ({ ...prev, maritalStatus: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        {maritalStatuses.map((m) => (
                          <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dependents">Number of Dependents</Label>
                    <Input
                      id="dependents"
                      type="number"
                      min="0"
                      value={editData.dependents || 0}
                      onChange={(e) => setEditData(prev => ({ ...prev, dependents: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={editData.address || ""}
                    onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter your complete address"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={editData.emergencyContact || ""}
                    onChange={(e) => setEditData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    placeholder="Emergency contact number"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={saveSection} disabled={updateMutation.isPending} className="bg-primary hover:bg-primary-dark text-primary-foreground">
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={cancelEditing} className="border-border hover:bg-accent">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium text-foreground">{data?.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium text-foreground">{data?.gender || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marital Status</p>
                  <p className="font-medium text-foreground">{data?.maritalStatus || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dependents</p>
                  <p className="font-medium text-foreground">{data?.dependents || 0}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-foreground">{data?.address || "Not specified"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Emergency Contact</p>
                  <p className="font-medium text-foreground">{data?.emergencyContact || "Not specified"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Information Section */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Professional Information</CardTitle>
            </div>
            {editingSection !== "professional" && (
              <Button variant="outline" size="sm" onClick={() => startEditing("professional")} className="border-border hover:bg-accent">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {editingSection === "professional" ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Textarea
                    id="skills"
                    value={editData.skills?.join(", ") || ""}
                    onChange={(e) => handleSkillsChange(e.target.value)}
                    placeholder="e.g., JavaScript, React, Node.js, Python"
                  />
                </div>
                <div>
                  <Label htmlFor="languages">Languages (comma-separated)</Label>
                  <Input
                    id="languages"
                    value={editData.languages?.join(", ") || ""}
                    onChange={(e) => handleLanguagesChange(e.target.value)}
                    placeholder="e.g., English, Hindi, Spanish"
                  />
                </div>
                <div>
                  <Label htmlFor="expectedSalary">Expected Salary (₹)</Label>
                  <Input
                    id="expectedSalary"
                    type="number"
                    min="0"
                    value={editData.expectedSalary || 0}
                    onChange={(e) => setEditData(prev => ({ ...prev, expectedSalary: parseInt(e.target.value) || 0 }))}
                    placeholder="Expected annual salary"
                  />
                </div>
                <div>
                  <Label htmlFor="jobCodes">Interested Job Codes (comma-separated)</Label>
                  <Input
                    id="jobCodes"
                    value={editData.jobCodes?.join(", ") || ""}
                    onChange={(e) => handleJobCodesChange(e.target.value)}
                    placeholder="e.g., DEV001, QA002, UI003"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={saveSection} disabled={updateMutation.isPending} className="bg-primary hover:bg-primary-dark text-primary-foreground">
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={cancelEditing} className="border-border hover:bg-accent">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {data?.skills && data.skills.length > 0 ? (
                      data.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-secondary text-secondary-foreground">{skill}</Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No skills specified</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {data?.languages && data.languages.length > 0 ? (
                      data.languages.map((language: string, index: number) => (
                        <Badge key={index} variant="outline" className="border-border">{language}</Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No languages specified</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Salary</p>
                    <p className="font-medium text-foreground">
                      {data?.expectedSalary ? `₹${data.expectedSalary.toLocaleString()}` : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interested Job Codes</p>
                    <p className="font-medium text-foreground">
                      {data?.jobCodes && data.jobCodes.length > 0 ? data.jobCodes.join(", ") : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Qualifications Section */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Qualifications</CardTitle>
            </div>
            {editingSection !== "qualifications" && (
              <Button variant="outline" size="sm" onClick={() => startEditing("qualifications")} className="border-border hover:bg-accent">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {editingSection === "qualifications" ? (
              <div className="space-y-3">
                {editData.qualifications?.map((qual: any, index: number) => (
                  <div key={index} className="p-3 border border-border bg-muted/30 rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm text-foreground">Qualification {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQualification(index)}
                        className="h-8 w-8 p-0 hover:bg-accent"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`degree-${index}`}>Degree</Label>
                        <Input
                          id={`degree-${index}`}
                          value={qual.degree || ""}
                          onChange={(e) => updateQualification(index, "degree", e.target.value)}
                          placeholder="e.g., Bachelor of Engineering"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`institution-${index}`}>Institution</Label>
                        <Input
                          id={`institution-${index}`}
                          value={qual.institution || ""}
                          onChange={(e) => updateQualification(index, "institution", e.target.value)}
                          placeholder="e.g., University of XYZ"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`year-${index}`}>Year</Label>
                        <Input
                          id={`year-${index}`}
                          value={qual.year || ""}
                          onChange={(e) => updateQualification(index, "year", e.target.value)}
                          placeholder="e.g., 2020"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`percentage-${index}`}>Percentage/GPA</Label>
                        <Input
                          id={`percentage-${index}`}
                          value={qual.percentage || ""}
                          onChange={(e) => updateQualification(index, "percentage", e.target.value)}
                          placeholder="e.g., 85% or 8.5 GPA"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addQualification}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Qualification
                </Button>
                <div className="flex space-x-2">
                  <Button onClick={saveSection} disabled={updateMutation.isPending} className="bg-primary hover:bg-primary-dark text-primary-foreground">
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={cancelEditing} className="border-border hover:bg-accent">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.qualifications && data.qualifications.length > 0 ? (
                  data.qualifications.map((qual: any, index: number) => (
                    <div key={index} className="p-3 bg-muted/30 border border-border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Degree</p>
                          <p className="font-medium text-foreground">{qual.degree || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Institution</p>
                          <p className="font-medium text-foreground">{qual.institution || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Year</p>
                          <p className="font-medium text-foreground">{qual.year || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Percentage/GPA</p>
                          <p className="font-medium text-foreground">{qual.percentage || "Not specified"}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground py-3">No qualifications added</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experience Section */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Work Experience</CardTitle>
            </div>
            {editingSection !== "experience" && (
              <Button variant="outline" size="sm" onClick={() => startEditing("experience")} className="border-border hover:bg-accent">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {editingSection === "experience" ? (
              <div className="space-y-3">
                {editData.experience?.map((exp: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">Experience {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`company-${index}`}>Company</Label>
                        <Input
                          id={`company-${index}`}
                          value={exp.company || ""}
                          onChange={(e) => updateExperience(index, "company", e.target.value)}
                          placeholder="e.g., ABC Corporation"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`position-${index}`}>Position</Label>
                        <Input
                          id={`position-${index}`}
                          value={exp.position || ""}
                          onChange={(e) => updateExperience(index, "position", e.target.value)}
                          placeholder="e.g., Software Developer"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`duration-${index}`}>Duration</Label>
                        <Input
                          id={`duration-${index}`}
                          value={exp.duration || ""}
                          onChange={(e) => updateExperience(index, "duration", e.target.value)}
                          placeholder="e.g., Jan 2020 - Dec 2022"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`description-${index}`}>Description</Label>
                      <Textarea
                        id={`description-${index}`}
                        value={exp.description || ""}
                        onChange={(e) => updateExperience(index, "description", e.target.value)}
                        placeholder="Describe your role and achievements"
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addExperience}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
                <div className="flex space-x-2">
                  <Button onClick={saveSection} disabled={updateMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={cancelEditing}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.experience && data.experience.length > 0 ? (
                  data.experience.map((exp: any, index: number) => (
                    <div key={index} className="p-3 bg-muted/50 dark:bg-muted/20 rounded-lg border border-border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Company</p>
                          <p className="font-medium text-foreground">{exp.company || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Position</p>
                          <p className="font-medium text-foreground">{exp.position || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="font-medium text-foreground">{exp.duration || "Not specified"}</p>
                        </div>
                      </div>
                      {exp.description && (
                        <div>
                          <p className="text-sm text-muted-foreground">Description</p>
                          <p className="font-medium text-foreground">{exp.description}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground py-3">No work experience added</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Documents & Resume</CardTitle>
            </div>
            {editingSection !== "documents" && (
              <Button variant="outline" size="sm" onClick={() => startEditing("documents")} className="border-border hover:bg-accent">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {editingSection === "documents" ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="resume">Resume Upload</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/10">
                    <input
                      type="file"
                      id="resume"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleResumeUpload(file);
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="resume"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or replace your resume
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Supports PDF, DOC, DOCX files
                      </p>
                    </label>
                  </div>
                  {data?.documents?.resume && (
                    <div className="mt-2 p-2 bg-muted/50 dark:bg-muted/20 rounded border border-border flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Current Resume</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(data.documents.resume, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button onClick={saveSection} disabled={updateMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={cancelEditing}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Resume</p>
                  {data?.documents?.resume ? (
                    <div className="flex items-center justify-between p-3 bg-muted/50 dark:bg-muted/20 rounded-lg border border-border">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">Resume uploaded</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(data.documents.resume, '_blank')}
                          className="hover:bg-accent"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-3">No resume uploaded</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};