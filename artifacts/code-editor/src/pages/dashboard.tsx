import React from "react";
import { useLocation } from "wouter";
import { useListProjects, useGetProjectStats, useListRecentProjects, getListProjectsQueryKey, getGetProjectStatsQueryKey, getListRecentProjectsQueryKey } from "@workspace/api-client-react";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Code2, Clock, FolderGit2, FileCode, BarChart3, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SiPython, SiHtml5, SiTypescript, SiReact, SiJavascript } from "react-icons/si";

function getLanguageIcon(language: string) {
  switch (language.toLowerCase()) {
    case "python": return <SiPython className="text-blue-500" />;
    case "html-css-js": return <SiHtml5 className="text-orange-500" />;
    case "typescript": return <SiTypescript className="text-blue-600" />;
    case "react": return <SiReact className="text-cyan-400" />;
    case "javascript": return <SiJavascript className="text-yellow-400" />;
    case "css": return <SiJavascript className="text-blue-400" />;
    default: return <Code2 className="text-muted-foreground" />;
  }
}

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useGetProjectStats();
  const { data: recentProjects, isLoading: recentLoading } = useListRecentProjects();
  const { data: allProjects, isLoading: projectsLoading } = useListProjects();

  return (
    <LayoutWrapper>
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back to your workspace.</p>
          </div>
          <Button onClick={() => setLocation("/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderGit2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{stats?.totalFiles || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{stats?.recentActivity || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Updates in last 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Projects
          </h2>
          
          {recentLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : recentProjects && recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.map((project) => (
                <Card 
                  key={project.id} 
                  className="hover:border-primary/50 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/editor/${project.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                      <div className="text-xl" title={project.language}>{getLanguageIcon(project.language)}</div>
                    </div>
                    {project.description && (
                      <CardDescription className="line-clamp-2 mt-1">{project.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardFooter className="pt-4 text-xs text-muted-foreground flex justify-between">
                    <span>{project.fileCount} files</span>
                    <span>Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                <FolderGit2 className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No projects yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first project to get started.</p>
                <Button onClick={() => setLocation("/new")}>Create Project</Button>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </LayoutWrapper>
  );
}