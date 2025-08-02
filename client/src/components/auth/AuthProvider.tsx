import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { authService } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const queryClient = useQueryClient();

  const { data: userProfile, refetch, isFetching: profileLoading } = useQuery({
    queryKey: ["/api/auth/profile"],
    enabled: !!user,
    retry: 1,
  });

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setAuthLoading(false);
      if (user) {
        // Refresh profile when user changes
        refetch();
      }
    });

    return unsubscribe;
  }, [refetch]);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      queryClient.clear();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const refreshProfile = () => {
    refetch();
  };

  const loading = authLoading || (user ? profileLoading : false);


  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
