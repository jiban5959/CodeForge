import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useListProjects, useGetProjectStats, useListRecentProjects, getListProjectsQueryKey, getGetProjectStatsQueryKey, getListRecentProjectsQueryKey } from "@workspace/api-client-react";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Code2, Clock, FolderGit2, FileCode, Activity, Shield, Users, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SiPython, SiHtml5, SiTypescript, SiReact, SiJavascript } from "react-icons/si";
import { useQueryClient } from "@tanstack/react-query";

function getLanguageIcon(language: string) {
  switch (language.toLowerCase()) {
    case "python": return <SiPython className="text-blue-400" />;
    case "html": case "html-css-js": return <SiHtml5 className="text-orange-500" />;
    case "typescript": return <SiTypescript className="text-blue-500" />;
    case "react": return <SiReact className="text-cyan-400" />;
    case "javascript": case "css": return <SiJavascript className="text-yellow-400" />;
    default: return <Code2 className="text-teal-400" />;
  }
}

interface AdminUser {
  id: number; name: string; email: string; role: string; createdAt: string; projectCount: number;
}
interface AdminProject {
  id: number; name: string; language: string; description: string | null;
  createdAt: string; updatedAt: string; ownerName: string; ownerEmail: string | null; fileCount: number;
}

function useAdminData(isAdmin: boolean) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    Promise.all([
      fetch(`${base}/api/admin/users`, { credentials: "include" }).then(r => r.json()),
      fetch(`${base}/api/admin/projects`, { credentials: "include" }).then(r => r.json()),
    ])
      .then(([u, p]) => { setUsers(u); setProjects(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin]);

  return { users, projects, loading };
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useGetProjectStats();
  const { data: recentProjects, isLoading: recentLoading } = useListRecentProjects();
  const { data: allProjects, isLoading: projectsLoading } = useListProjects();
  const { users: adminUsers, projects: adminProjects, loading: adminLoading } = useAdminData(isAdmin);

  return (
    <LayoutWrapper>
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-950 border border-teal-700/60 text-teal-400">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
            </div>
            <p className="text-gray-500">Welcome back, <span className="text-teal-400">{user?.name}</span></p>
          </div>
          <Button onClick={() => setLocation("/new")} className="gap-2 bg-teal-500 hover:bg-teal-400 text-black shadow-[0_0_15px_rgba(45,212,191,0.25)]">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: isAdmin ? "Total Projects" : "Your Projects", value: stats?.totalProjects ?? 0, icon: <FolderGit2 className="h-4 w-4 text-teal-500" />, loading: statsLoading },
            { label: isAdmin ? "Total Files" : "Your Files", value: stats?.totalFiles ?? 0, icon: <FileCode className="h-4 w-4 text-teal-500" />, loading: statsLoading },
            { label: "Recent Activity", value: stats?.recentActivity ?? 0, icon: <Activity className="h-4 w-4 text-teal-500" />, loading: statsLoading, sub: "Updates in last 7 days" },
          ].map((s, i) => (
            <Card key={i} className="bg-[#040f11] border-teal-900/40 hover:border-teal-700/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">{s.label}</CardTitle>
                {s.icon}
              </CardHeader>
              <CardContent>
                {s.loading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                )}
                {s.sub && <p className="text-xs text-gray-600 mt-1">{s.sub}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ADMIN: Users Table */}
        {isAdmin && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-teal-400" /> All Users
            </h2>
            {adminLoading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : (
              <div className="rounded-xl border border-teal-900/40 bg-[#040f11] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-teal-900/30">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-900/20">
                    {adminUsers.map(u => (
                      <tr key={u.id} className="hover:bg-teal-950/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-teal-500 flex items-center justify-center text-black text-xs font-bold shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-white">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3">
                          {u.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-teal-950 border border-teal-800/60 text-teal-400">
                              <Shield className="h-2.5 w-2.5" /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-900 border border-gray-700/60 text-gray-400">
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-teal-400 font-medium">{u.projectCount}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                    {adminUsers.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-600">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Recent Projects */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2 text-white">
            <Clock className="h-5 w-5 text-teal-400" />
            {isAdmin ? "Recent Activity (All Users)" : "Recent Projects"}
          </h2>
          {recentLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : recentProjects && recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.map(project => (
                <Card
                  key={project.id}
                  className="bg-[#040f11] border-teal-900/40 hover:border-teal-600/50 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(45,212,191,0.06)]"
                  onClick={() => setLocation(`/editor/${project.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base text-white line-clamp-1">{project.name}</CardTitle>
                      <div className="text-xl">{getLanguageIcon(project.language)}</div>
                    </div>
                    {project.description && (
                      <CardDescription className="line-clamp-2 mt-1 text-gray-600">{project.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardFooter className="pt-3 text-xs text-gray-600 flex justify-between">
                    <span>{project.fileCount} files</span>
                    <span>Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-teal-900/40 bg-[#040f11]">
              <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                <FolderGit2 className="h-12 w-12 text-teal-900 mb-4" />
                <h3 className="text-lg font-medium text-white">No projects yet</h3>
                <p className="text-sm text-gray-600 mt-1 mb-4">Create your first project to get started.</p>
                <Button onClick={() => setLocation("/new")} className="bg-teal-500 hover:bg-teal-400 text-black">
                  Create Project
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ADMIN: All Projects Table */}
        {isAdmin && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
              <FolderGit2 className="h-5 w-5 text-teal-400" /> All Projects
            </h2>
            {adminLoading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : (
              <div className="rounded-xl border border-teal-900/40 bg-[#040f11] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-teal-900/30">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-900/20">
                    {adminProjects.map(p => (
                      <tr
                        key={p.id}
                        className="hover:bg-teal-950/20 transition-colors cursor-pointer"
                        onClick={() => setLocation(`/editor/${p.id}`)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-white">{p.name}</span>
                          {p.description && <p className="text-xs text-gray-600 truncate max-w-48">{p.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{p.ownerName}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{getLanguageIcon(p.language)}</span>
                            <span className="text-gray-500 capitalize">{p.language}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-teal-400 font-medium">{p.fileCount}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}
                        </td>
                        <td className="px-4 py-3">
                          <ChevronRight className="h-4 w-4 text-gray-700" />
                        </td>
                      </tr>
                    ))}
                    {adminProjects.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-600">No projects found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </LayoutWrapper>
  );
}
