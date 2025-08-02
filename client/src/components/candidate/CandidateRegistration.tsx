import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

import { Plus, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { uploadDocument, uploadCertificates } from "@/lib/documentApi";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocation } from "wouter";

import { genders, maritalStatuses, allowedFileTypes } from "@shared/constants";

interface CandidateFormData {
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  dependents: number;
  address: string;
  emergencyContact: string;
  qualifications: Array<{
    degree: string;
    institution: string;
    year: string;
    percentage: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
  }>;
  skills: string[];
  languages: string[];
  expectedSalary: number;
  jobCodes: string[];
  documents: Record<string, string>;
}

export const CandidateRegistration: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CandidateFormData>({
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    dependents: 0,
    address: "",
    emergencyContact: "",
    qualifications: [{ degree: "", institution: "", year: "", percentage: "" }],
    experience: [],
    skills: [],
    languages: [],
    expectedSalary: 0,
    jobCodes: [],
    documents: {},
  });
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | File[]>>({});
  const { user, refreshProfile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: keyof CandidateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addArrayItem = (field: "qualifications" | "experience") => {
    const newItem = field === "qualifications" 
      ? { degree: "", institution: "", year: "", percentage: "" }
      : { company: "", position: "", duration: "", description: "" };
    
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], newItem]
    }));
  };

  const removeArrayItem = (field: "qualifications" | "experience", index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: "qualifications" | "experience", index: number, updates: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? { ...item, ...updates } : item)
    }));
  };

  const handleFileSelect = (file: File, documentType: string) => {
    // Validate file type
    if (!allowedFileTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload only PDF or image files (JPG, PNG)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload files smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      uploadedAt: new Date().toISOString(),
    };

    setSelectedFiles(prev => {
      if (documentType === 'certificates') {
        const arr = (prev[documentType] as File[] | undefined) || [];
        return { ...prev, [documentType]: [...arr, file] };
      }
      return { ...prev, [documentType]: file };
    });

    updateFormData('documents', {
      ...formData.documents,
      [documentType]: JSON.stringify(fileInfo),
    });

    toast({
      title: "File Selected",
      description: `${file.name} ready for submission`,
    });
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.dateOfBirth && formData.gender && formData.address);
      case 2:
        return formData.qualifications.some(q => q.degree && q.institution);
      case 3:
        const experienceValid = formData.experience.every(exp => {
          const values = [exp.company, exp.position, exp.duration, exp.description];
          const filled = values.filter(v => v && v.toString().trim() !== "").length;
          if (filled === 0) return true;
          return !!(exp.company && exp.position && exp.duration);
        });
        return formData.skills.length > 0 && experienceValid;
      case 4:
        return formData.expectedSalary > 0;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (currentStep < totalSteps) {
      if (isStepValid(currentStep)) {
        setCurrentStep(prev => prev + 1);
      } else {
        toast({
          title: "Please complete required fields",
          description: "Fill in all mandatory fields before continuing",
          variant: "destructive",
        });
      }
      return;
    }

    setLoading(true);
    try {
      const uploadedDocs: Record<string, any> = {};
      if (selectedFiles.aadhaar) {
        const res = await uploadDocument('candidate', 'aadhar', selectedFiles.aadhaar as File);
        uploadedDocs.aadhaar = res.document;
      }
      if (selectedFiles.pan) {
        const res = await uploadDocument('candidate', 'pan', selectedFiles.pan as File);
        uploadedDocs.pan = res.document;
      }
      if (selectedFiles.resume) {
        const res = await uploadDocument('candidate', 'resume', selectedFiles.resume as File);
        uploadedDocs.resume = res.document;
      }
      if (selectedFiles.certificates) {
        const res = await uploadCertificates(selectedFiles.certificates as File[]);
        uploadedDocs.certificates = res.documents;
      }

      const cleanedExperience = formData.experience.filter(exp =>
        Object.values(exp).some(v => v && v.toString().trim() !== "")
      );

      await apiRequest("/api/candidates", "POST", {
        userId: user?.uid,
        ...formData,
        experience: cleanedExperience,
        documents: uploadedDocs,
      });

      toast({
        title: "Success",
        description: "Profile created successfully!",
      });
      
      // Refresh profile and navigate to the newly created profile page
      refreshProfile();
      setLocation("/candidate/profile");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                  max={new Date(new Date().getFullYear() - 14, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                  min={new Date(new Date().getFullYear() - 80, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Minimum age: 14 years</p>
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => updateFormData("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genders.map((g) => (

                      <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="marital">Marital Status</Label>
                <Select value={formData.maritalStatus} onValueChange={(value) => updateFormData("maritalStatus", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
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
                  value={formData.dependents}
                  onChange={(e) => updateFormData("dependents", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder="Enter your complete address"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="emergency">Emergency Contact</Label>
                <Input
                  id="emergency"
                  value={formData.emergencyContact}
                  onChange={(e) => updateFormData("emergencyContact", e.target.value)}
                  placeholder="Emergency contact person and number"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Qualifications</h3>
            {formData.qualifications.map((qual, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Qualification {index + 1}</h4>
                  {formData.qualifications.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem("qualifications", index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Degree/Qualification *</Label>
                    <Input
                      value={qual.degree}
                      onChange={(e) => updateArrayItem("qualifications", index, { degree: e.target.value })}
                      placeholder="e.g., B.Tech, MBA"
                      required
                    />
                  </div>
                  <div>
                    <Label>Institution *</Label>
                    <Input
                      value={qual.institution}
                      onChange={(e) => updateArrayItem("qualifications", index, { institution: e.target.value })}
                      placeholder="Institution name"
                      required
                    />
                  </div>
                  <div>
                    <Label>Year of Completion *</Label>
                    <Input
                      value={qual.year}
                      onChange={(e) => updateArrayItem("qualifications", index, { year: e.target.value })}
                      placeholder="2020"
                      required
                    />
                  </div>
                  <div>
                    <Label>Percentage/CGPA</Label>
                    <Input
                      value={qual.percentage}
                      onChange={(e) => updateArrayItem("qualifications", index, { percentage: e.target.value })}
                      placeholder="85% or 8.5 CGPA"
                    />
                  </div>
                </div>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() => addArrayItem("qualifications")}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Qualification
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Experience & Skills</h3>
            
            <div>
              <h4 className="font-medium mb-4">Work Experience</h4>
              {formData.experience.map((exp, index) => (
                <Card key={index} className="p-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-medium">Experience {index + 1}</h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem("experience", index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Company Name</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateArrayItem("experience", index, { company: e.target.value })}
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <Label>Position</Label>
                      <Input
                        value={exp.position}
                        onChange={(e) => updateArrayItem("experience", index, { position: e.target.value })}
                        placeholder="Job title"
                      />
                    </div>
                    <div>
                      <Label>Experience Duration (in months)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={exp.duration}
                        onChange={(e) => updateArrayItem("experience", index, { duration: e.target.value })}
                        placeholder="e.g., 24 (for 2 years)"
                      />
                      <p className="text-sm text-gray-500 mt-1">Enter total months of experience</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateArrayItem("experience", index, { description: e.target.value })}
                        placeholder="Job responsibilities and achievements"
                      />
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={() => addArrayItem("experience")}
                className="w-full mb-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Experience
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="skills">Skills (comma separated)</Label>
                <Textarea
                  id="skills"
                  value={formData.skills.join(", ")}
                  onChange={(e) => updateFormData("skills", e.target.value.split(",").map(s => s.trim()))}
                  placeholder="React, Node.js, Python, Project Management"
                />
              </div>
              <div>
                <Label htmlFor="languages">Languages (comma separated)</Label>
                <Textarea
                  id="languages"
                  value={formData.languages.join(", ")}
                  onChange={(e) => updateFormData("languages", e.target.value.split(",").map(s => s.trim()))}
                  placeholder="English, Hindi, Tamil"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Job Preferences & Documents</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="salary">Expected Salary (Annual)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.expectedSalary}
                  onChange={(e) => updateFormData("expectedSalary", parseInt(e.target.value) || 0)}
                  placeholder="1200000"
                />
              </div>
              <div>
                <Label htmlFor="jobCodes">Job Codes (comma separated)</Label>
                <Input
                  id="jobCodes"
                  value={formData.jobCodes.join(", ")}
                  onChange={(e) => updateFormData("jobCodes", e.target.value.split(",").map(s => s.trim()))}
                  placeholder="SE001, PM002, DA003"
                />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-4">Document Uploads</h4>
              <p className="text-sm text-gray-600 mb-4">
                Select your documents. File information will be stored for verification purposes.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                {["aadhaar", "pan", "resume", "certificates"].map((docType) => (
                  <div key={docType} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2 capitalize">
                      Upload {docType} {docType === "aadhaar" || docType === "pan" ? "Card" : docType === "resume" ? "" : "Documents"}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      PDF, JPG, PNG (max 5MB)
                    </p>
                    {formData.documents[docType] && (
                      <p className="text-xs text-green-600 mb-2">
                        ✓ {(() => {
                          try {
                            const fileInfo = JSON.parse(formData.documents[docType]);
                            return fileInfo.name;
                          } catch {
                            return "File selected";
                          }
                        })()}
                      </p>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, docType);
                      }}
                      className="hidden"
                      id={`upload-${docType}`}
                    />
                    <label
                      htmlFor={`upload-${docType}`}
                      className="text-primary hover:text-primary-dark font-medium cursor-pointer"
                    >
                      {formData.documents[docType] ? "✓ Uploaded" : "Choose File"}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <CardTitle>Create Your Candidate Profile</CardTitle>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>

        <CardContent>
          {renderStep()}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : currentStep === totalSteps ? "Complete Profile" : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
