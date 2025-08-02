import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Moon, Sun } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { Link, useLocation } from "wouter";

export const Navbar: React.FC = () => {
  const { user, userProfile, signOut } = useAuth();
  const profileStatus =
    userProfile?.role === "candidate"
      ? userProfile.candidate?.profileStatus ?? "incomplete"
      : userProfile?.role === "employer"
      ? userProfile.employer?.profileStatus ?? "incomplete"
      : null;
  const isIncomplete =
    (userProfile?.role === "candidate" || userProfile?.role === "employer") &&
    profileStatus === "incomplete";
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const getNavItems = () => {
    if (!userProfile || isIncomplete) return [];
    
    switch (userProfile.role) {
      case "candidate":
        return [
          { label: "Dashboard", href: "/candidate/dashboard" },
          { label: "Jobs", href: "/candidate" },
          { label: "Applications", href: "/candidate/applications" },
        ];
      case "employer":
        return [
          { label: "Dashboard", href: "/employer/dashboard" },
          { label: "Jobs", href: "/employer/jobs" },
        ];
      case "admin":
        return [
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Search", href: "/admin/search" },
          { label: "Verifications", href: "/admin/verifications" },
          { label: "Admin Tools", href: "/admin/tools" },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  if (!user) return null;

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary cursor-pointer">
                  LokalTalent
                </h1>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        location === item.href
                          ? "text-primary bg-blue-50 dark:bg-blue-900/30"
                          : "text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ""} alt={userProfile?.name} />
                    <AvatarFallback>
                      {userProfile?.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userProfile?.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {userProfile?.role === "candidate" && userProfile.candidate && (
                    <Link href="/candidate/profile">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                {userProfile?.role === "employer" && userProfile.employer && (
                    <Link href="/employer/profile">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                {userProfile?.role !== "admin" && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
