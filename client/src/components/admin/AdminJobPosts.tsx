import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobCard } from "@/components/common";
import { Link } from "wouter";
import {
  Filter,
  SortAsc,
  Search,
  Eye,
  MapPin,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Briefcase,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getJobStatus } from "@shared/utils/jobStatus";

export const AdminJobPosts: React.FC = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("latest");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["/api/admin/jobs"],
  });

  const getStatusColor = (s: string) => {
    switch (s) {
      case "active":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400";
      case "onHold":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400";
      case "dormant":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400";
      case "fulfilled":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "onHold":
        return <AlertTriangle className="h-4 w-4" />;
      case "dormant":
        return <Clock className="h-4 w-4" />;
      case "fulfilled":
        return <Briefcase className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredJobs = React.useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) return [];
    let list = jobs.filter((job: any) => {
      const st = getJobStatus(job);
      const match =
        job.title?.toLowerCase().includes(search.toLowerCase()) ||
        job.location?.toLowerCase().includes(search.toLowerCase()) ||
        job.jobCode?.toLowerCase().includes(search.toLowerCase());
      const statusOk = status === "all" || st === status;
      return match && statusOk;
    });
    list.sort((a: any, b: any) => {
      if (sort === "latest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    return list;
  }, [jobs, search, status, sort]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Job Posts</h1>
        <Badge variant="outline" className="border-border">
          {Array.isArray(jobs) ? jobs.length : 0} jobs
        </Badge>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <div className="flex gap-4">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-40 bg-background border-border">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="onHold">On Hold</SelectItem>
                  <SelectItem value="dormant">Dormant</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-40 bg-background border-border">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-card border-border">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job: any) => (
            <JobCard
              key={job.id}
              job={{
                title: job.title,
                positions: job.vacancy,
                qualification: job.minQualification,
                experience: job.experienceRequired,
                city: job.location,
                jobCode: job.jobCode,
                postedOn: formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }),
              }}
              actions={
                <Link href={`/admin/jobs/${job.id}`}>
                  <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </Link>
              }
            >
              <div className="flex items-center gap-3 mb-2">
                <Badge className={getStatusColor(getJobStatus(job))}>
                  {getStatusIcon(getJobStatus(job))}
                  <span className="ml-1 capitalize">{getJobStatus(job)}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {job.applicationsCount || 0} applications
                </div>
              </div>
              <p className="text-muted-foreground text-sm line-clamp-2">{job.description}</p>
              <div className="mt-3 flex gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                </div>
              </div>
            </JobCard>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Briefcase className="h-16 w-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No jobs found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
