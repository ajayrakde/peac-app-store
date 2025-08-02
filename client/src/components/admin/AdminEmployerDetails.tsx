import React from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { BackButton } from "@/components/common";
import { DocumentList } from "@/components/common/DocumentList";

export const AdminEmployerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: employer, isLoading } = useQuery({
    queryKey: [`/api/admin/employers/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="animate-pulse bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Employer not found</h3>
            <BackButton fallback="/admin/dashboard" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <BackButton fallback="/admin/dashboard" variant="outline" size="sm" />
        <h1 className="text-3xl font-bold text-foreground">Employer Details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">Organization Name:</span>{" "}
              <span className="font-medium">{employer.organizationName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Registration No.:</span>{" "}
              <span className="font-medium">{employer.registrationNumber}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Industry:</span>{" "}
              <span className="font-medium">{employer.businessType}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Contact Email:</span>{" "}
              <span className="font-medium">{employer.contactEmail}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Contact Phone:</span>{" "}
              <span className="font-medium">{employer.contactPhone}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Address:</span>{" "}
              <span className="font-medium">{employer.address}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {employer.documents && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentList
              docs={Object.entries(employer.documents)
                .map(([key, value]) => {
                  let doc: any = null;
                  if (typeof value === "string") {
                    try { doc = JSON.parse(value); } catch {}
                  } else if (value && typeof value === "object") {
                    doc = value;
                  }
                  if (doc && typeof doc === "object" && "filename" in doc) {
                    return { type: key, filename: doc.filename, uploadedAt: doc.uploadedAt || "" };
                  }
                  return null;
                })
                .filter(Boolean) as any}
              userType="employer"
              uid={id}
              hideFilename
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminEmployerDetails;
