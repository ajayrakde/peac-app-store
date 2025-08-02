import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { useToast } from "../../hooks/use-toast";
import {
  BarChart3,
  FlaskConical,
  Trash2,
  UserCog,
  Bell,
  ClipboardList,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Star,
  StarOff,
  Download,
  Calendar,
  Users,
  Building2,
  FileText,
  Eye,
  Mail,
  RotateCcw,
} from "lucide-react";

// Tool definition type
interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  description?: string;
}

// Reports & Analytics Component
const ReportsAnalytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Reports & Analytics</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Reports
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-primary" />
              <div className="text-right">
                <div className="text-2xl font-bold">2,451</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Building2 className="h-8 w-8 text-primary" />
              <div className="text-right">
                <div className="text-2xl font-bold">342</div>
                <div className="text-sm text-muted-foreground">Companies</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <FileText className="h-8 w-8 text-primary" />
              <div className="text-right">
                <div className="text-2xl font-bold">1,287</div>
                <div className="text-sm text-muted-foreground">Active Jobs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts would go here - add your preferred charting library */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 h-[300px] flex items-center justify-center border-2 border-dashed border-muted">
            <p className="text-muted-foreground">Weekly Registrations Chart</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 h-[300px] flex items-center justify-center border-2 border-dashed border-muted">
            <p className="text-muted-foreground">Job Applications Chart</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Compatibility Engine Component
const CompatibilityEngine: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Compatibility Engine</h2>
      {/* Add compatibility engine UI here */}
    </div>
  );
};

// Soft Delete Manager Component
const SoftDeleteManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Soft Delete Manager</h2>
      {/* Add soft delete manager UI here */}
    </div>
  );
};

// User Impersonation Component
const UserImpersonation: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">User Impersonation</h2>
      {/* Add user impersonation UI here */}
    </div>
  );
};

// Define available tools
const tools: Tool[] = [
  {
    id: "reports",
    name: "Reports & Analytics",
    icon: <BarChart3 className="h-5 w-5" />,
    component: ReportsAnalytics,
    description: "View and export platform statistics and reports"
  },
  {
    id: "compatibility",
    name: "Compatibility Engine",
    icon: <FlaskConical className="h-5 w-5" />,
    component: CompatibilityEngine,
    description: "Manage job-candidate matching algorithms"
  },
  {
    id: "soft-delete",
    name: "Soft Delete Manager",
    icon: <Trash2 className="h-5 w-5" />,
    component: SoftDeleteManager,
    description: "Manage deleted items and restoration"
  },
  {
    id: "impersonation",
    name: "User Impersonation",
    icon: <UserCog className="h-5 w-5" />,
    component: UserImpersonation,
    description: "View platform as specific users"
  },
  // Placeholder tools for future expansion
  {
    id: "notifications",
    name: "Notifications",
    icon: <Bell className="h-5 w-5" />,
    component: () => <div>Coming Soon</div>,
    description: "Manage system notifications"
  },
  {
    id: "audit",
    name: "Audit Logs",
    icon: <ClipboardList className="h-5 w-5" />,
    component: () => <div>Coming Soon</div>,
    description: "View system audit trails"
  },
  {
    id: "access",
    name: "Access Control",
    icon: <ShieldAlert className="h-5 w-5" />,
    component: () => <div>Coming Soon</div>,
    description: "Manage admin permissions"
  }
];

export const AdminTools: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState(tools[0]);
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const { toast } = useToast();

  // Handle favoriting/unfavoriting tools
  const toggleFavorite = (toolId: string) => {
    setFavorites(current => 
      current.includes(toolId) 
        ? current.filter(id => id !== toolId)
        : [...current, toolId]
    );
  };

  // Filter tools based on search
  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort tools with favorites first
  const sortedTools = [...filteredTools].sort((a, b) => {
    const aFav = favorites.includes(a.id);
    const bFav = favorites.includes(b.id);
    if (aFav === bFav) return 0;
    return aFav ? -1 : 1;
  });

  const SelectedComponent = selectedTool.component;

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <div className={`border-r border-border bg-card transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}>
        <div className="p-4 border-b border-border">
          <div className={`flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          }`}>
            <h2 className={`font-semibold text-foreground ${
              collapsed ? "hidden" : "block"
            }`}>
              Admin Tools
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(c => !c)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!collapsed && (
            <div className="mt-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tools..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          )}
        </div>
        
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-2">
            {sortedTools.map(tool => (
              <Button
                key={tool.id}
                variant={selectedTool.id === tool.id ? "secondary" : "ghost"}
                className={`w-full justify-start mb-1 ${
                  collapsed ? "px-2" : "px-4"
                }`}
                onClick={() => setSelectedTool(tool)}
              >
                <div className="flex items-center gap-3">
                  {tool.icon}
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{tool.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(tool.id);
                        }}
                      >
                        {favorites.includes(tool.id) ? (
                          <Star className="h-4 w-4 fill-primary text-primary" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <SelectedComponent />
        </div>
      </div>
    </div>
  );
};
