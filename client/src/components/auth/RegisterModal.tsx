import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { ConfirmationResult } from "firebase/auth";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: string;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen, 
  onClose, 
  defaultRole = "candidate" 
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: defaultRole,
  });

  // Update role when defaultRole prop changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, role: defaultRole }));
  }, [defaultRole]);

  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    if (!passwordRegex.test(formData.password)) {
      toast({
        title: "Weak Password",
        description:
          "Password must be at least 8 characters and include uppercase, lowercase and special character.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    try {
      const user = await authService.signUpWithEmail(formData.email, formData.password);
      await authService.sendVerificationEmail(user);

      // Create user profile in backend
      await apiRequest("/api/auth/register", "POST", {
        firebaseUid: user.uid,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null,
        name: formData.name,
        role: formData.role,
      });

      toast({
        title: "Success",
        description: "Check your email to verify your account.",
      });
      onClose();
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = "Failed to create account. ";
      
      // Handle backend errors
      if (error.code === "EMAIL_EXISTS" || error.message?.includes("Email already registered")) {
        errorMessage = "This email is already registered. Please use a different email or try logging in.";
      }
      // Handle Firebase errors
      else if (error.message?.includes("auth/invalid-api-key")) {
        errorMessage += "Please configure Firebase authentication with valid API keys.";
      } else if (error.message?.includes("auth/email-already-in-use")) {
        errorMessage = "This email is already registered. Please use a different email or try logging in.";
      } else if (error.message?.includes("auth/weak-password")) {
        errorMessage += "Password should be at least 6 characters.";
      } else {
        errorMessage += "Please try again or contact support.";
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.initializeRecaptcha("recaptcha-container");
      const confirmation = await authService.signInWithPhone(`+91${formData.phone}`);
      setConfirmationResult(confirmation);
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please configure Firebase authentication with valid API keys.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;

    setLoading(true);
    try {
      const user = await authService.verifyOTP(confirmationResult, otp);
      if (formData.email) {
        await authService.sendVerificationEmail(user);
      }

      // Create user profile in backend
      await apiRequest("/api/auth/register", "POST", {
        firebaseUid: user.uid,
        email: formData.email || "",
        password: formData.password,
        phone: formData.phone,
        name: formData.name,
        role: formData.role,
      });

      toast({
        title: "Success",
        description: "Check your email to verify your account.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      const user = await authService.signInWithGoogle();
      await apiRequest("/api/auth/register", "POST", {
        firebaseUid: user.uid,
        email: user.email,
        name: user.displayName,
        role: formData.role,
      });
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Google sign-in failed.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Create Your Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">
              Registering as: {formData.role === "candidate" ? "Job Seeker" : "Employer"}
            </p>
          </div>

          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Create a password"
              required
            />
          </div>



          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="9876543210"
              required
            />
          </div>

          <Button
            onClick={handleEmailRegister}
            disabled={loading || !formData.name || !formData.email || !formData.password || !formData.phone}
            className="w-full"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

          <Button onClick={handleGoogleRegister} className="w-full" variant="outline">
            Continue with Google
          </Button>

          <div id="recaptcha-container"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};