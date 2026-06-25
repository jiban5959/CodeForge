import { Router, type IRouter } from "express";
import { eq, desc, gte, sql } from "drizzle-orm";
import { db, projectsTable, filesTable } from "@workspace/db";
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

function serializeProject(p: { createdAt: Date; updatedAt: Date; [key: string]: unknown }) {
  return { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
}

function serializeFile(f: { createdAt: Date; updatedAt: Date; [key: string]: unknown }) {
  return { ...f, createdAt: f.createdAt.toISOString(), updatedAt: f.updatedAt.toISOString() };
}

router.get("/projects", async (_req, res): Promise<void> => {
  const projects = await db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      description: projectsTable.description,
      language: projectsTable.language,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
      fileCount: sql<number>`cast(count(${filesTable.id}) as int)`,
    })
    .from(projectsTable)
    .leftJoin(filesTable, eq(filesTable.projectId, projectsTable.id))
    .groupBy(projectsTable.id)
    .orderBy(desc(projectsTable.updatedAt));
  res.json(ListProjectsResponse.parse(projects.map(serializeProject)));
});

router.get("/projects/recent", async (_req, res): Promise<void> => {
  const projects = await db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      description: projectsTable.description,
      language: projectsTable.language,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
      fileCount: sql<number>`cast(count(${filesTable.id}) as int)`,
    })
    .from(projectsTable)
    .leftJoin(filesTable, eq(filesTable.projectId, projectsTable.id))
    .groupBy(projectsTable.id)
    .orderBy(desc(projectsTable.updatedAt))
    .limit(6);
  res.json(ListRecentProjectsResponse.parse(projects.map(serializeProject)));
});

router.get("/projects/stats", async (_req, res): Promise<void> => {
  const [totals] = await db
    .select({
      totalProjects: sql<number>`cast(count(distinct ${projectsTable.id}) as int)`,
      totalFiles: sql<number>`cast(count(${filesTable.id}) as int)`,
    })
    .from(projectsTable)
    .leftJoin(filesTable, eq(filesTable.projectId, projectsTable.id));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [{ recentActivity }] = await db
    .select({ recentActivity: sql<number>`cast(count(*) as int)` })
    .from(projectsTable)
    .where(gte(projectsTable.updatedAt, sevenDaysAgo));

  const byLanguageRows = await db
    .select({
      language: projectsTable.language,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(projectsTable)
    .groupBy(projectsTable.language)
    .orderBy(desc(sql<number>`count(*)`));

  res.json(
    GetProjectStatsResponse.parse({
      totalProjects: totals?.totalProjects ?? 0,
      totalFiles: totals?.totalFiles ?? 0,
      recentActivity: recentActivity ?? 0,
      byLanguage: byLanguageRows,
    })
  );
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .insert(projectsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      language: parsed.data.language,
    })
    .returning();

  res.status(201).json(CreateProjectResponse.parse(serializeProject({ ...project, fileCount: 0 })));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const files = await db
    .select()
    .from(filesTable)
    .where(eq(filesTable.projectId, params.data.id))
    .orderBy(filesTable.name);

  res.json(GetProjectResponse.parse({
    ...serializeProject(project),
    files: files.map(serializeFile),
  }));
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .update(projectsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [{ fileCount }] = await db
    .select({ fileCount: sql<number>`cast(count(*) as int)` })
    .from(filesTable)
    .where(eq(filesTable.projectId, params.data.id));

  res.json(UpdateProjectResponse.parse(serializeProject({ ...project, fileCount: fileCount ?? 0 })));
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const [deleted] = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
