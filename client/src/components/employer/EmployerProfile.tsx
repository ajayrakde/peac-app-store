import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { industries } from "@shared/constants";
import { 
  Building, 
  Edit, 
  Save, 
  X, 
  FileText, 
  Upload, 
  Download,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { listDocuments } from "@/lib/documentApi";
import { DocumentList } from "@/components/common/DocumentList";

interface EmployerData {
  id: number;
  organizationName: string;
  registrationNumber: string;
  businessType: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  documents: Record<string, string>;
  profileStatus: string;
  createdAt: string;
  updatedAt: string;
}

export const EmployerProfile: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<EmployerData>>({});
  
  const isAdmin = userProfile?.role === "admin";

  const { data, isLoading } = useQuery<EmployerData>({
    queryKey: ["/api/employers/profile"],
    enabled: true,
  });
  const { data: docs } = useQuery({
    queryKey: ["/api/employers/documents"],
    queryFn: () => listDocuments('employer'),
    enabled: true,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<EmployerData>) => {
      if (!data?.id) throw new Error("No employer data available");
      const response = await apiRequest(`/api/employers/${data.id}`, "PATCH", updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employers/profile"] });
      setEditingSection(null);
      setEditData({});
      toast({
        title: "Profile updated",
        description: "Your employer profile has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  const startEditing = (section: string) => {
    setEditingSection(section);
    setEditData(data || {});
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditData({});
  };

  const saveSection = () => {
    updateMutation.mutate(editData);
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    const fileData = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      uploadedAt: new Date().toISOString()
    };

    setEditData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: JSON.stringify(fileData)
      }
    }));

    toast({
      title: "Document uploaded",
      description: `${file.name} has been uploaded successfully`,
    });
  };



  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-card border-border">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Building className="h-16 w-16 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No profile found</h3>
        <p className="text-muted-foreground">Please complete your employer registration first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employer Profile</h1>
          <p className="text-muted-foreground">
            Manage your organization details and verification status
          </p>
        </div>
        {data.profileStatus === "verified" && (
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
            <Shield className="h-4 w-4 mr-1" />
            Verified
          </Badge>
        )}
      </div>

      {/* Organization Information */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-primary" />
            <CardTitle className="text-foreground">Organization Information</CardTitle>
          </div>
          {editingSection !== "organization" && isAdmin && (
            <Button variant="outline" size="sm" onClick={() => startEditing("organization")} className="border-border hover:bg-accent">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {editingSection === "organization" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    value={editData.organizationName || ""}
                    onChange={(e) => setEditData({ ...editData, organizationName: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={editData.registrationNumber || ""}
                    onChange={(e) => setEditData({ ...editData, registrationNumber: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="businessType">Industry</Label>
                <Select
                  value={editData.businessType || ""}
                  onValueChange={(value) => setEditData({ ...editData, businessType: value })}
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
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={editData.address || ""}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  rows={3}
                  className="bg-background border-border"
                />
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Organization Name</p>
                  <p className="font-medium text-foreground">{data.organizationName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-medium text-foreground">{data.registrationNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-medium text-foreground">{data.businessType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium text-foreground">
                    {new Date(data.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Business Address</p>
                <p className="font-medium text-foreground">{data.address}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-primary" />
            <CardTitle className="text-foreground">Contact Information</CardTitle>
          </div>
          {editingSection !== "contact" && isAdmin && (
            <Button variant="outline" size="sm" onClick={() => startEditing("contact")} className="border-border hover:bg-accent">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {editingSection === "contact" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={editData.contactEmail || ""}
                    onChange={(e) => setEditData({ ...editData, contactEmail: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={editData.contactPhone || ""}
                    onChange={(e) => setEditData({ ...editData, contactPhone: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{data.contactEmail}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{data.contactPhone}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents & Verification */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-foreground">Documents & Verification</CardTitle>
          </div>
          {editingSection !== "documents" && isAdmin && (
            <Button variant="outline" size="sm" onClick={() => startEditing("documents")} className="border-border hover:bg-accent">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {editingSection === "documents" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Business Registration Certificate</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/10">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "registration");
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
                </div>

                <div>
                  <Label>GST Certificate</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/10">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "gst");
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
                </div>
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Business Registration</p>
                  {data.documents?.registration ? (
                    <div className="flex items-center justify-between p-3 bg-muted/50 dark:bg-muted/20 rounded-lg border border-border">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">Certificate uploaded</span>
                      </div>
                      <Button variant="ghost" size="sm" className="hover:bg-accent">
                        <Download className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-3">No certificate uploaded</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">GST Certificate</p>
                  {data.documents?.gst ? (
                    <div className="flex items-center justify-between p-3 bg-muted/50 dark:bg-muted/20 rounded-lg border border-border">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">Certificate uploaded</span>
                      </div>
                      <Button variant="ghost" size="sm" className="hover:bg-accent">
                        <Download className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-3">No certificate uploaded</p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-400">Verification Status</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {data.profileStatus === "verified"
                        ? "Your organization has been verified and can post jobs"
                        : "Your documents are under review. Verification typically takes 2-3 business days"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentList userType="employer" docs={(docs as any)?.documents || []} />
        </CardContent>
      </Card>
    </div>
  );
};