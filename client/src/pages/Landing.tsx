import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/auth/LoginModal";
import { RegisterModal } from "@/components/auth/RegisterModal";
import { Users, Building, Settings } from "lucide-react";

export const Landing: React.FC = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerRole, setRegisterRole] = useState<string>("candidate");

  const handleRegisterCandidate = () => {
    setRegisterRole("candidate");
    setShowRegisterModal(true);
  };

  const handleRegisterEmployer = () => {
    setRegisterRole("employer");
    setShowRegisterModal(true);
  };

  const handleAdminLogin = () => {
    setShowLoginModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary">
                LokalTalent
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowLoginModal(true)}
                variant="ghost"
                className="text-muted-foreground hover:text-primary hover:bg-accent"
              >
                Sign In
              </Button>
              <Button
                onClick={() => setShowRegisterModal(true)}
                className="bg-primary hover:bg-primary-dark text-primary-foreground px-6 py-2 rounded-lg"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
            Connect Talent with{" "}
            <span className="text-primary">Opportunity</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Advanced AI-powered matching platform connecting the right candidates with the right employers.
            Built for modern recruitment needs.
          </p>

        </div>

        {/* Main Entry Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          <Card className="bg-card border-border hover:shadow-xl dark:hover:shadow-2xl transition-shadow cursor-pointer">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Find Jobs</h3>
              <p className="text-muted-foreground mb-6">
                Discover your dream job with AI-powered matching and personalized recommendations.
              </p>
              <Button
                onClick={handleRegisterCandidate}
                className="bg-primary hover:bg-primary-dark text-primary-foreground px-6 py-2 rounded-lg font-medium"
              >
                Get Started as Candidate
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:shadow-xl dark:hover:shadow-2xl transition-shadow cursor-pointer">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Hire Talent</h3>
              <p className="text-muted-foreground mb-6">
                Post jobs and find the perfect candidates with advanced filtering and matching.
              </p>
              <Button
                onClick={handleRegisterEmployer}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Start Hiring
              </Button>
            </CardContent>
          </Card>


        </div>

        {/* Features Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Why Choose LokalTalent?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold mb-2 text-foreground">AI-Powered Matching</h3>
              <p className="text-muted-foreground text-sm">
                Advanced algorithms analyze skills, experience, and preferences for perfect matches.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Secure & Verified</h3>
              <p className="text-muted-foreground text-sm">
                Document verification and secure authentication ensure trust and safety.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Real-time Analytics</h3>
              <p className="text-muted-foreground text-sm">
                Track applications, view analytics, and optimize your hiring process.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        defaultRole={registerRole}
      />
    </div>
  );
};
