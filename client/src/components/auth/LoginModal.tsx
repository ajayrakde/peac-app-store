import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { ConfirmationResult } from "firebase/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  roleHint?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  roleHint,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await authService.signInWithEmail(email, password);
      if (!user.emailVerified) {
        setShowResend(true);
        await authService.sendVerificationEmail(user);
        await authService.signOut();
        toast({
          title: "Email Not Verified",
          description: "Check your email to verify your account.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      onClose();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Login failed. ";
      if (error.message?.includes("auth/invalid-api-key")) {
        errorMessage += "Please configure Firebase authentication with valid API keys.";
      } else if (error.message?.includes("auth/user-not-found")) {
        errorMessage += "No account found with this email.";
      } else if (error.message?.includes("auth/wrong-password")) {
        errorMessage += "Incorrect password.";
      } else if (error.message?.includes("auth/invalid-email")) {
        errorMessage += "Invalid email address.";
      } else {
        errorMessage += "Please check your credentials and try again.";
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.initializeRecaptcha("recaptcha-container");
      const confirmation = await authService.signInWithPhone(`+91${phone}`);
      setConfirmationResult(confirmation);
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await authService.signInWithGoogle();
      if (!user.emailVerified) {
        setShowResend(true);
        await authService.sendVerificationEmail(user);
        await authService.signOut();
        toast({
          title: "Email Not Verified",
          description: "Check your email to verify your account.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Success", description: "Logged in successfully!" });
      onClose();
      if (onLoginSuccess) onLoginSuccess();
    } catch (error) {
      toast({ title: "Error", description: "Google sign-in failed.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const user = auth.currentUser;
    if (user) {
      await authService.sendVerificationEmail(user);
      toast({ title: "Verification Sent", description: "Please check your email." });
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;

    setLoading(true);
    try {
      await authService.verifyOTP(confirmationResult, otp);
      toast({
        title: "Success",
        description: "Phone verified successfully!",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid OTP. Please try again.",
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
            Sign In to LokalTalent
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="email" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin}>
                Continue with Google
              </Button>
              {showResend && (
                <Button type="button" variant="ghost" className="w-full" onClick={handleResend}>
                  Resend Verification Email
                </Button>
              )}
            </form>
          </TabsContent>

          <TabsContent value="phone" className="space-y-4">
            {!confirmationResult ? (
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <PhoneInput
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOTPVerification} className="space-y-4">
                <div>
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>

        <div id="recaptcha-container"></div>
      </DialogContent>
    </Dialog>
  );
};
