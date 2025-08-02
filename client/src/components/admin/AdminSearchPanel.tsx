import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateCard, EmployerCard, JobCard } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, Search, SortAsc, MoreVertical, Eye, Edit, Trash2, CheckCircle, User, Building2, FileText, FlaskConical, Users, Briefcase, MapPin, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { debugLog } from "@/lib/logger";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocation, Link } from "wouter";
import {
  qualifications,
  experienceLevels,
  profileStatus,
  industries,
  businessSizes,
  jobStatus,
} from "@shared/constants";

interface SearchFilters {
  qualification?: string;
  experience?: string;
  city?: string;
  status?: string;
  industry?: string;
  size?: string;
  category?: string;
  location?: string;
}

interface Candidate {
  id: number;
  type: 'candidate';
  name: string;
  email: string;
  qualification: string;
  experience: string | { years: number };
  city: string;
  status: 'verified' | 'pending' | 'rejected';
  avatar?: string;
}

interface Employer {
  id: number;
  type: 'employer';
  companyName: string;
  industry: string;
  size: string;
  city: string;
  status: 'verified' | 'pending' | 'rejected';
  logo?: string;
}

interface JobPost {
  id: number;
  type: 'job';
  title: string;
  employer: string;
  employerId: number;
  city: string;
  status: 'pending' | 'onHold' | 'active' | 'fulfilled' | 'dormant';
  postedOn: string;
  category: string;
  experienceRequired: string;
}

type SearchResult = Candidate | Employer | JobPost;

// Enhanced search hook with proper typing
const useAdminSearch = (type: string, query: string, filters: SearchFilters, sort: string) => {
  return useQuery({
    queryKey: ['/api/admin/search', type, query, filters, sort],
    queryFn: async () => {
      try {
        // Skip if no meaningful search criteria
        if (!query && Object.values(filters).every(v => !v)) {
          return [];
        }

        const queryParams: Record<string, string> = {
          type,
          sort,
          ...Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v != null && v !== '')
          )
        };
        if (query) {
          queryParams.q = query;
        }
        const params = new URLSearchParams(queryParams);
        
        const response = await apiRequest(`/api/admin/search?${params}`, 'GET');
        const data = await response.json();
        
        // Log the response for debugging
        debugLog('Search response:', data);
        
        if (!response.ok) {
          throw new Error(data.message || data.error || 'Search failed');
        }

        // Extract results from the response
        const results = data.success ? data.data : data;
        return Array.isArray(results) ? results : [];
        
      } catch (error) {
        console.error('Search error:', error);
        throw error instanceof Error ? error : new Error('Search failed');
      }
    },
    enabled: query.length >= 2 || Object.keys(filters).length > 0,
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });
};

export const AdminSearchPanel: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not admin
  React.useEffect(() => {
    if (!user || userProfile?.role !== "admin") {
      setLocation("/admin");
    }
  }, [user, userProfile, setLocation]);

  const [type, setType] = useState<'candidate' | 'employer' | 'job'>('candidate');
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<'latest' | 'name' | 'relevance'>('latest');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: results = [], isLoading, isError, error } = useAdminSearch(
    type,
    debouncedSearch,
    filters,
    sort
  );

  const handleDelete = async (entity: string, id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await apiRequest(`/api/admin/${entity}s/${id}`, 'DELETE');
  };

  // Filter definitions per type with predefined options
  const filterOptions = {
    candidate: [
      {
        key: "qualification",
        label: "Qualification",
        options: qualifications,
      },
      {
        key: "experience",
        label: "Experience",
        options: experienceLevels,
      },
      {
        key: "status",
        label: "Verification Status",
        options: profileStatus,
      },
    ],
    employer: [
      {
        key: "industry",
        label: "Industry",
        options: industries,
      },
      {
        key: "size",
        label: "Business Size",
        options: businessSizes,
      },
      {
        key: "status",
        label: "Verification Status",
        options: profileStatus,
      },
    ],
    job: [
      {
        key: "industry",
        label: "Industry",
        options: industries,
      },
      {
        key: "experience",
        label: "Experience",
        options: experienceLevels,
      },
      {
        key: "status",
        label: "Status",
        options: jobStatus,
      },
    ],
  };

  // Card renderers
  const getNested = (obj: any, keys: string[]) => {
    for (const key of keys) {
      if (obj && obj[key] !== undefined) {
        return obj[key];
      }
    }
    return undefined;
  };

  const renderCard = (item: any) => {
    if (item.type === "candidate") {
      const candidate = getNested(item, ["candidate", "candidates", "candidateData"]);
      const user = getNested(item, ["user", "users"]);
      const actions = (
        <div className="flex gap-2">
          <Link href={`/admin/candidates/${candidate?.id || item.id}`}> 
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/candidates/${candidate?.id || item.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete('candidate', candidate?.id || item.id)}>
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <FlaskConical className="h-4 w-4 mr-2" />Run Compatibility
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );

      return (
        <CandidateCard
          key={item.id}
          candidate={{
            fullName: user?.name ?? item.name,
            qualification: candidate?.qualifications?.[0]?.degree ?? item.qualification,
            industry: item.industry,
            experience:
              typeof candidate?.experience?.[0]?.position === "string"
                ? candidate?.experience?.[0]?.position
                : typeof item.experience === "object"
                ? `${item.experience.years} years`
                : item.experience,
            city: candidate?.address ?? item.city,
          }}
          actions={actions}
        />
      );
    }
    if (item.type === "employer") {
      const employer = getNested(item, ["employer", "employers", "employerData"]);
      const actions = (
        <div className="flex gap-2">
          <Link href={`/admin/employers/${employer?.id || item.id}`}> 
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/employers/${employer?.id || item.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete('employer', employer?.id || item.id)}>
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <FlaskConical className="h-4 w-4 mr-2" />Run Compatibility
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );

      return (
        <EmployerCard
          key={item.id}
          employer={{
            organizationName: employer?.organizationName ?? item.organizationName,
            registrationNumber: employer?.registrationNumber ?? item.registrationNumber,
            industry: employer?.businessType ?? item.businessType,
            city: employer?.city ?? item.city,
          }}
          actions={actions}
        />
      );
    }
    if (item.type === "job") {
      const job = getNested(item, ["job", "jobPost", "jobPosts"]);
      const actions = (
        <div className="flex gap-2">
          <Link href={`/admin/jobs/${job?.id || item.id}`}> 
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/jobs/${job?.id || item.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete('job', job?.id || item.id)}>
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <FlaskConical className="h-4 w-4 mr-2" />Run Compatibility
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );

      return (
        <JobCard
          key={item.id}
          job={{
            title: job?.title ?? item.title,
            jobCode: job?.jobCode ?? item.jobCode,
            positions: job?.vacancy ?? item.vacancy,
            qualification: job?.minQualification ?? item.minQualification,
            experience: job?.experienceRequired ?? item.experienceRequired,
            city: job?.city ?? item.city
          }}
          actions={actions}
        />
      );
    }
    // Fallback for mixed/all
    return null;
  };

  // Mixed list for "all"
  const renderMixedCard = (item: any) => {
    const candidate = getNested(item, ["candidate", "candidates", "candidateData"]);
    const user = getNested(item, ["user", "users"]);
    const employer = getNested(item, ["employer", "employers", "employerData"]);
    const job = getNested(item, ["job", "jobPost", "jobPosts"]);

    let icon = <User className="h-5 w-5 text-primary" />;
    let label = "Candidate";
    if (item.type === "employer") {
      icon = <Building2 className="h-5 w-5 text-primary" />;
      label = "Employer";
    } else if (item.type === "job") {
      icon = <FileText className="h-5 w-5 text-primary" />;
      label = "Job Post";
    }

    return (
      <Card key={item.id} className="bg-card border-border">
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {icon}
              <span className="font-semibold text-foreground">
                {user?.name || employer?.organizationName || job?.title || item.name || item.companyName || item.title}
              </span>
              <Badge variant="outline">{label}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {item.type === "candidate" && `${candidate?.qualifications?.[0]?.degree ?? item.qualification} • ${candidate?.experience?.[0]?.position ?? item.experience} • ${candidate?.address ?? item.city}`}
              {item.type === "employer" && `${employer?.businessType ?? item.industry} • ${employer?.address ?? item.city}`}
              {item.type === "job" && `${job?.location ?? item.city} • Posted ${job?.createdAt ?? item.postedOn}`}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={item.type === 'candidate' ? `/admin/candidates/${candidate?.id || item.id}` : item.type === 'employer' ? `/admin/employers/${employer?.id || item.id}` : `/admin/jobs/${job?.id || item.id}` }>
              <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={item.type === 'candidate' ? `/admin/candidates/${candidate?.id || item.id}/edit` : item.type === 'employer' ? `/admin/employers/${employer?.id || item.id}/edit` : `/admin/jobs/${job?.id || item.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(item.type, item.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />Delete
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <FlaskConical className="h-4 w-4 mr-2" />Run Compatibility
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Tabs value={type} onValueChange={setType} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="candidate">Candidates</TabsTrigger>
            <TabsTrigger value="employer">Employers</TabsTrigger>
            <TabsTrigger value="job">Job Posts</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex-1 w-full md:w-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10 bg-background border-border"
            placeholder="Search by name, email, company, job title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowFilters(v => !v)}>
          <Filter className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SortAsc className="h-4 w-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSort("latest")}>Latest</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSort("name")}>Name</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSort("relevance")}>Relevance</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Context-Specific Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border border-border">
          {filterOptions[type].map(opt => (
            <div key={opt.key} className="flex flex-col min-w-[200px]">
              <label className="text-xs font-medium mb-1">{opt.label}</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    {filters[opt.key] || `Select ${opt.label}`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                  {opt.options.map(value => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => setFilters(f => ({ ...f, [opt.key]: value }))}
                    >
                      {value}
                    </DropdownMenuItem>
                  ))}
                  {filters[opt.key] && (
                    <DropdownMenuItem
                      onClick={() => setFilters(f => {
                        const newFilters = { ...f };
                        delete newFilters[opt.key];
                        return newFilters;
                      })}
                      className="text-destructive"
                    >
                      Clear
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          {Object.keys(filters).length > 0 && (
            <Button
              variant="outline"
              className="self-end"
              onClick={() => setFilters({})}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <div className="mt-4 text-muted-foreground">Loading results...</div>
          </div>
        ) : isError ? (
          <div className="text-center text-destructive py-12">
            <div className="mb-2">Error loading results</div>
            <div className="text-sm text-muted-foreground">
              {error instanceof Error 
                ? error.message.includes('<!DOCTYPE') 
                  ? 'Server error occurred. Please try again.' 
                  : error.message
                : 'Please try again'}
            </div>
            {import.meta.env.DEV && error instanceof Error && (
              <pre className="mt-4 text-xs text-left bg-muted/30 p-4 rounded overflow-auto">
                {error.message}
              </pre>
            )}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {search || Object.keys(filters).length > 0 ? (
              <>
                <div className="mb-2">No results found</div>
                <div className="text-sm">Try adjusting your search or filters</div>
              </>
            ) : (
              <>
                <div className="mb-2">Start searching</div>
                <div className="text-sm">Use the search bar or filters above to find {type}s</div>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-muted-foreground">
                Found {results.length} {type}{results.length !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-muted-foreground">
                Showing verified {type}s only
              </div>
            </div>
            <div className="space-y-4">
              {results.map(renderCard)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
