import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/auth/LoginModal";
import { Shield, Lock, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { getAuth } from "firebase/auth";
import { apiRequest } from "@/lib/queryClient";

export const Admin: React.FC = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading, refreshProfile } = useAuth();

  // Early redirect for admin users
  useEffect(() => {
    const redirectIfAdmin = async () => {
      if (user && !authLoading) {
        try {
          // Force a profile refresh to ensure we have the latest role
          if (userProfile?.role === "admin") {
            setLocation("/admin/dashboard");
          }
        } catch (error) {
          console.error("Profile refresh failed:", error);
        }
      }
    };
    redirectIfAdmin();
  }, [user, authLoading, userProfile, setLocation]);

  // Show loading state only during initial auth check
  if (authLoading || (user && userProfile?.role === "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Called after successful Firebase login in LoginModal
  const handleAdminLogin = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("No Firebase user");
      const firebaseToken = await firebaseUser.getIdToken();
      const response = await apiRequest("/api/admin/login", "POST", { firebaseToken });
      if (!response.ok) throw new Error("Not an admin or invalid credentials");
      const data = await response.json();
      toast({ title: "Welcome, Admin!", description: data.user.name || data.user.email });
      refreshProfile();
      setShowLoginModal(false);
      setLocation("/admin/dashboard");
    } catch (error: any) {
      toast({ title: "Admin Login Failed", description: error.message || "Access denied", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-primary">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-primary">
                LokalTalent Admin
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-10 w-10 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin Portal Access
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Secure access to platform management and AI matching engine
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center">
                <Lock className="h-5 w-5 text-amber-600 mr-2" />
                <span className="text-amber-800 font-medium">Restricted Access</span>
              </div>
              <p className="text-amber-700 text-sm mt-1">
                This area is restricted to authorized administrators only.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Admin Features:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                  AI-powered candidate-job matching engine
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                  Platform analytics and reporting
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                  User management and verification
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                  Data export and system monitoring
                </li>
              </ul>
            </div>

            <Button
              onClick={() => setShowLoginModal(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Admin Login"}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Only authorized personnel with admin credentials can access this portal.
            </p>
          </CardContent>
        </Card>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleAdminLogin}
        roleHint="admin"
      />
    </div>
  );
};