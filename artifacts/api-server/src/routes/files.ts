import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, filesTable, projectsTable } from "@workspace/db";
import {
  CreateFileBody,
  CreateFileParams,
  UpdateFileBody,
  UpdateFileParams,
  DeleteFileParams,
  GetFileParams,
  ListFilesParams,
  ListFilesResponse,
  GetFileResponse,
  CreateFileResponse,
  UpdateFileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeFile(f: { createdAt: Date; updatedAt: Date; [key: string]: unknown }) {
  return { ...f, createdAt: f.createdAt.toISOString(), updatedAt: f.updatedAt.toISOString() };
}

router.get("/projects/:id/files", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListFilesParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const files = await db
    .select()
    .from(filesTable)
    .where(eq(filesTable.projectId, params.data.id))
    .orderBy(filesTable.name);

  res.json(ListFilesResponse.parse(files.map(serializeFile)));
});

router.post("/projects/:id/files", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CreateFileParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const parsed = CreateFileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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

  const [file] = await db
    .insert(filesTable)
    .values({
      projectId: params.data.id,
      name: parsed.data.name,
      language: parsed.data.language,
      content: parsed.data.content,
    })
    .returning();

  res.status(201).json(CreateFileResponse.parse(serializeFile(file)));
});

router.get("/projects/:id/files/:fileId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawFileId = Array.isArray(req.params.fileId) ? req.params.fileId[0] : req.params.fileId;
  const params = GetFileParams.safeParse({
    id: parseInt(rawId, 10),
    fileId: parseInt(rawFileId, 10),
  });
  if (!params.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const [file] = await db
    .select()
    .from(filesTable)
    .where(and(eq(filesTable.id, params.data.fileId), eq(filesTable.projectId, params.data.id)));

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.json(GetFileResponse.parse(serializeFile(file)));
});

router.patch("/projects/:id/files/:fileId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawFileId = Array.isArray(req.params.fileId) ? req.params.fileId[0] : req.params.fileId;
  const params = UpdateFileParams.safeParse({
    id: parseInt(rawId, 10),
    fileId: parseInt(rawFileId, 10),
  });
  if (!params.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const parsed = UpdateFileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [file] = await db
    .update(filesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(filesTable.id, params.data.fileId), eq(filesTable.projectId, params.data.id)))
    .returning();

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.json(UpdateFileResponse.parse(serializeFile(file)));
});

router.delete("/projects/:id/files/:fileId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawFileId = Array.isArray(req.params.fileId) ? req.params.fileId[0] : req.params.fileId;
  const params = DeleteFileParams.safeParse({
    id: parseInt(rawId, 10),
    fileId: parseInt(rawFileId, 10),
  });
  if (!params.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const [deleted] = await db
    .delete(filesTable)
    .where(and(eq(filesTable.id, params.data.fileId), eq(filesTable.projectId, params.data.id)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
