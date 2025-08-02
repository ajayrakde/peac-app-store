import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, FileText, Upload, Save, X } from "lucide-react";
import { uploadDocument } from "@/lib/documentApi";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { debugLog } from "@/lib/logger";
import { useLocation } from "wouter";
import { useAuth } from "@/components/auth/AuthProvider";
import { industries } from "@shared/constants";

interface EmployerFormData {
  organizationName: string;
  registrationNumber: string;
  businessType: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  documents: Record<string, string>;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  uploadedAt: string;
  data: string;
}

export const EmployerRegistration: React.FC = () => {
  const [, setLocation] = useLocation();
  const { refreshProfile } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<EmployerFormData>({
    organizationName: "",
    registrationNumber: "",
    businessType: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    documents: {}
  });
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});

  // Check if employer profile already exists
  const { data: existingProfile, isLoading: checkingProfile } = useQuery({
    queryKey: ["/api/employers/profile"],
    retry: false,
  });

  useEffect(() => {
    if (existingProfile && !checkingProfile) {
      setLocation("/employer/profile");
    }
  }, [existingProfile, checkingProfile, setLocation]);

  const createEmployerMutation = useMutation({
    mutationFn: async (employerData: EmployerFormData) => {
      try {
        debugLog("Submitting employer data:", employerData);
        const response = await apiRequest("/api/employers", "POST", employerData);
        const result = await response.json();
        debugLog("Registration response:", result);
        return result;
      } catch (error: any) {
        console.error("Registration error:", error);
        
        // If employer profile already exists, redirect to profile
        if (error.message && error.message.includes("409") && error.message.includes("already exists")) {
          toast({
            title: "Profile already exists",
            description: "Redirecting to your existing profile",
          });
          refreshProfile();
          setLocation("/employer/profile");
          return;
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      debugLog("Registration successful:", data);
      toast({
        title: "Registration successful",
        description: "Your employer profile has been created successfully",
      });
      refreshProfile();
      setLocation("/employer/profile");
    },
    onError: (error: any) => {
      console.error("Registration mutation error:", error);
      
      // Handle existing profile case
      if (error.message && error.message.includes("409")) {
        toast({
          title: "Profile already exists",
          description: "Redirecting to your existing profile",
        });
        refreshProfile();
        setLocation("/employer/profile");
        return;
      }
      
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (file: File, documentType: string) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    setSelectedFiles(prev => ({ ...prev, [documentType]: file }));
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      uploadedAt: new Date().toISOString(),
    };
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, [documentType]: JSON.stringify(fileInfo) },
    }));
    toast({
      title: "File Selected",
      description: `${file.name} ready for upload`,
    });
  };

  const handleSubmit = async () => {
    const requiredFields = ['organizationName', 'registrationNumber', 'businessType', 'address', 'contactEmail', 'contactPhone'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof EmployerFormData]);

    if (missingFields.length > 0) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const uploaded: Record<string, any> = {};
    if (selectedFiles.registration) {
      const res = await uploadDocument('employer', 'registration', selectedFiles.registration);
      uploaded.registration = res.document;
    }
    if (selectedFiles.gst) {
      const res = await uploadDocument('employer', 'gst', selectedFiles.gst);
      uploaded.gst = res.document;
    }

    createEmployerMutation.mutate({ ...formData, documents: uploaded });
  };



  // Show loading while checking for existing profile
  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking your profile status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <Building className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Employer Profile</h1>
          <p className="text-muted-foreground">
            Provide your organization details to start posting jobs and finding talent
          </p>
        </div>

        <div className="space-y-6">
          {/* Organization Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Building className="h-5 w-5 mr-2 text-primary" />
                Organization Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organizationName">Organization Name *</Label>
                  <Input
                    id="organizationName"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    placeholder="e.g., Tech Solutions Inc."
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="registrationNumber">Registration Number *</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="e.g., CIN/GST Number"
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="businessType">Industry *</Label>
                <Select
                  value={formData.businessType}
                  onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="address">Business Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Complete business address"
                  rows={3}
                  className="bg-background border-border"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="hr@company.com"
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="bg-background border-border"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Business Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Business Registration */}
                <div>
                  <Label>Business Registration Certificate</Label>
                  {formData.documents?.registration ? (
                    <div className="border border-border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="font-medium text-green-800 dark:text-green-400">
                              {JSON.parse(formData.documents.registration).name}
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {(JSON.parse(formData.documents.registration).size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              documents: {
                                ...prev.documents,
                                registration: ""
                              }
                            }));
                          }}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/10">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelect(file, "registration");
                          }
                        }}
                        className="hidden"
                        id="registration-upload"
                      />
                      <label
                        htmlFor="registration-upload"
                        className="cursor-pointer flex flex-col items-center justify-center"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload certificate
                        </p>
                      </label>
                    </div>
                  )}
                </div>

                {/* GST Certificate */}
                <div>
                  <Label>GST Certificate (Optional)</Label>
                  {formData.documents?.gst ? (
                    <div className="border border-border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="font-medium text-green-800 dark:text-green-400">
                              {JSON.parse(formData.documents.gst).name}
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {(JSON.parse(formData.documents.gst).size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              documents: {
                                ...prev.documents,
                                gst: ""
                              }
                            }));
                          }}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/10">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelect(file, "gst");
                          }
                        }}
                        className="hidden"
                        id="gst-upload"
                      />
                      <label
                        htmlFor="gst-upload"
                        className="cursor-pointer flex flex-col items-center justify-center"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload GST certificate
                        </p>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                * Please upload clear, readable documents. Supported formats: PDF, JPG, PNG (Max 10MB each)
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleSubmit} 
              disabled={createEmployerMutation.isPending}
              className="bg-primary hover:bg-primary-dark text-primary-foreground px-8 py-3"
            >
              {createEmployerMutation.isPending ? (
                <>
                  <X className="h-4 w-4 mr-2 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Complete Registration
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};