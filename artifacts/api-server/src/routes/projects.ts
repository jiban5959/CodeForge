import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, gte, sql, isNull, or } from "drizzle-orm";
import { db, projectsTable, filesTable, usersTable } from "@workspace/db";
import {
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
  ListProjectsResponse,
  GetProjectResponse,
  CreateProjectResponse,
  UpdateProjectResponse,
  GetProjectStatsResponse,
  ListRecentProjectsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.session.userId) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

function serializeProject(p: { createdAt: Date; updatedAt: Date; [key: string]: unknown }) {
  return { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
}

function serializeFile(f: { createdAt: Date; updatedAt: Date; [key: string]: unknown }) {
  return { ...f, createdAt: f.createdAt.toISOString(), updatedAt: f.updatedAt.toISOString() };
}

function userFilter(req: Request) {
  if (req.session.userRole === "admin") return undefined;
  return eq(projectsTable.userId, req.session.userId!);
}

router.get("/projects", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const isAdmin = req.session.userRole === "admin";

  const baseQuery = db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      description: projectsTable.description,
      language: projectsTable.language,
      userId: projectsTable.userId,
      ownerName: usersTable.name,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
      fileCount: sql<number>`cast(count(${filesTable.id}) as int)`,
    })
    .from(projectsTable)
    .leftJoin(filesTable, eq(filesTable.projectId, projectsTable.id))
    .leftJoin(usersTable, eq(usersTable.id, projectsTable.userId))
    .groupBy(projectsTable.id, usersTable.name)
    .orderBy(desc(projectsTable.updatedAt));

  const projects = isAdmin
    ? await baseQuery
    : await baseQuery.where(eq(projectsTable.userId, req.session.userId!));

  res.json(ListProjectsResponse.parse(projects.map(p => serializeProject({ ...p, ownerName: p.ownerName ?? null }))));
});

router.get("/projects/recent", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const isAdmin = req.session.userRole === "admin";

  const baseQuery = db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      description: projectsTable.description,
      language: projectsTable.language,
      userId: projectsTable.userId,
      ownerName: usersTable.name,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
      fileCount: sql<number>`cast(count(${filesTable.id}) as int)`,
    })
    .from(projectsTable)
    .leftJoin(filesTable, eq(filesTable.projectId, projectsTable.id))
    .leftJoin(usersTable, eq(usersTable.id, projectsTable.userId))
    .groupBy(projectsTable.id, usersTable.name)
    .orderBy(desc(projectsTable.updatedAt))
    .limit(6);

  const projects = isAdmin
    ? await baseQuery
    : await baseQuery.where(eq(projectsTable.userId, req.session.userId!));

  res.json(ListRecentProjectsResponse.parse(projects.map(p => serializeProject({ ...p, ownerName: p.ownerName ?? null }))));
});

router.get("/projects/stats", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const isAdmin = req.session.userRole === "admin";
  const filter = isAdmin ? undefined : eq(projectsTable.userId, req.session.userId!);

  const totalsQuery = db
    .select({
      totalProjects: sql<number>`cast(count(distinct ${projectsTable.id}) as int)`,
      totalFiles: sql<number>`cast(count(${filesTable.id}) as int)`,
    })
    .from(projectsTable)
    .leftJoin(filesTable, eq(filesTable.projectId, projectsTable.id));

  const [totals] = filter ? await totalsQuery.where(filter) : await totalsQuery;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const activityQuery = db
    .select({ recentActivity: sql<number>`cast(count(*) as int)` })
    .from(projectsTable)
    .where(filter ? and(filter, gte(projectsTable.updatedAt, sevenDaysAgo)) : gte(projectsTable.updatedAt, sevenDaysAgo));

  const [{ recentActivity }] = await activityQuery;

  const byLangQuery = db
    .select({ language: projectsTable.language, count: sql<number>`cast(count(*) as int)` })
    .from(projectsTable)
    .groupBy(projectsTable.language)
    .orderBy(desc(sql<number>`count(*)`));

  const byLanguageRows = filter ? await byLangQuery.where(filter) : await byLangQuery;

  res.json(
    GetProjectStatsResponse.parse({
      totalProjects: totals?.totalProjects ?? 0,
      totalFiles: totals?.totalFiles ?? 0,
      recentActivity: recentActivity ?? 0,
      byLanguage: byLanguageRows,
    })
  );
});

router.post("/projects", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .insert(projectsTable)
    .values({
      userId: req.session.userId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      language: parsed.data.language,
    })
    .returning();

  res.status(201).json(CreateProjectResponse.parse(serializeProject({ ...project, fileCount: 0 })));
});

router.get("/projects/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  if (req.session.userRole !== "admin" && project.userId !== req.session.userId) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const files = await db.select().from(filesTable).where(eq(filesTable.projectId, params.data.id)).orderBy(filesTable.name);

  res.json(GetProjectResponse.parse({ ...serializeProject(project), files: files.map(serializeFile) }));
});

router.patch("/projects/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [existing] = await db.select({ userId: projectsTable.userId }).from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Project not found" }); return; }
  if (req.session.userRole !== "admin" && existing.userId !== req.session.userId) {
    res.status(403).json({ error: "Access denied" }); return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [project] = await db
    .update(projectsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  const [{ fileCount }] = await db
    .select({ fileCount: sql<number>`cast(count(*) as int)` })
    .from(filesTable)
    .where(eq(filesTable.projectId, params.data.id));

  res.json(UpdateProjectResponse.parse(serializeProject({ ...project, fileCount: fileCount ?? 0 })));
});

router.delete("/projects/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [existing] = await db.select({ userId: projectsTable.userId }).from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Project not found" }); return; }
  if (req.session.userRole !== "admin" && existing.userId !== req.session.userId) {
    res.status(403).json({ error: "Access denied" }); return;
  }

  await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
