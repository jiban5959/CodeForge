import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import projectsRouter from "./projects";
import filesRouter from "./files";
import executionRouter from "./execution";

const router: IRouter = Router();

router.use(authRouter);
router.use(adminRouter);
router.use(healthRouter);
router.use(projectsRouter);
router.use(filesRouter);
router.use(executionRouter);

export default router;
