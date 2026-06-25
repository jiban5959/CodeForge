import { Router, type IRouter, type Request, type Response } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, usersTable, projectsTable, filesTable } from "@workspace/db";

const router: IRouter = Router();

function requireAdmin(req: Request, res: Response): boolean {
  if (!req.session.userId) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  if (req.session.userRole !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

router.get("/admin/users", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
      projectCount: sql<number>`cast(count(${projectsTable.id}) as int)`,
    })
    .from(usersTable)
    .leftJoin(projectsTable, eq(projectsTable.userId, usersTable.id))
    .groupBy(usersTable.id)
    .orderBy(desc(usersTable.createdAt));

  res.json(users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

router.get("/admin/projects", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const projects = await db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      language: projectsTable.language,
      description: projectsTable.description,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
      ownerName: usersTable.name,
      ownerEmail: usersTable.email,
      fileCount: sql<number>`cast(count(${filesTable.id}) as int)`,
    })
    .from(projectsTable)
    .leftJoin(usersTable, eq(usersTable.id, projectsTable.userId))
    .leftJoin(filesTable, eq(filesTable.projectId, projectsTable.id))
    .groupBy(projectsTable.id, usersTable.name, usersTable.email)
    .orderBy(desc(projectsTable.updatedAt));

  res.json(projects.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    ownerName: p.ownerName ?? "Unassigned",
    ownerEmail: p.ownerEmail ?? null,
  })));
});

export default router;
