import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  reload,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { auth } from "./firebase";

export class AuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  async signInWithEmail(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      throw new Error(`Email sign-in failed: ${error}`);
    }
  }

  async signUpWithEmail(email: string, password: string) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      throw new Error(`Email sign-up failed: ${error}`);
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      throw new Error(`Google sign-in failed: ${error}`);
    }
  }

  async sendVerificationEmail(user: User) {
    try {
      await sendEmailVerification(user);
    } catch (error) {
      throw new Error(`Sending verification email failed: ${error}`);
    }
  }

  async reloadUser(user: User) {
    try {
      await reload(user);
    } catch (error) {
      throw new Error(`Reload user failed: ${error}`);
    }
  }

  async initializeRecaptcha(containerId: string) {
    if (!this.recaptchaVerifier) {
      this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          // Reset reCAPTCHA
          this.recaptchaVerifier?.clear();
          this.recaptchaVerifier = null;
        }
      });
    }
    return this.recaptchaVerifier;
  }

  async signInWithPhone(phoneNumber: string): Promise<ConfirmationResult> {
    try {
      if (!this.recaptchaVerifier) {
        throw new Error("reCAPTCHA not initialized");
      }
      
      const confirmationResult = await signInWithPhoneNumber(
        auth, 
        phoneNumber, 
        this.recaptchaVerifier
      );
      return confirmationResult;
    } catch (error) {
      throw new Error(`Phone sign-in failed: ${error}`);
    }
  }

  async verifyOTP(confirmationResult: ConfirmationResult, otp: string) {
    try {
      const result = await confirmationResult.confirm(otp);
      return result.user;
    } catch (error) {
      throw new Error(`OTP verification failed: ${error}`);
    }
  }

  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error(`Sign out failed: ${error}`);
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  async getCurrentUserToken() {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  }
}

export const authService = new AuthService();
