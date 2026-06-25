import { Router, type IRouter } from "express";
import { exec } from "child_process";
import { writeFileSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { RunCodeBody, RunCodeResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function runWithTimeout(
  command: string,
  stdin: string | undefined,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number; executionTime: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = exec(command, { timeout: timeoutMs }, (error, stdout, stderr) => {
      const executionTime = (Date.now() - start) / 1000;
      resolve({
        stdout: stdout ?? "",
        stderr: error && error.killed ? "Execution timed out (5s limit)" : (stderr ?? ""),
        exitCode: error ? (error.code ?? 1) : 0,
        executionTime,
      });
    });

    if (stdin && child.stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }
  });
}

router.post("/run", async (req, res): Promise<void> => {
  const parsed = RunCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { language, code, stdin } = parsed.data;
  const tempDir = tmpdir();
  const timestamp = Date.now();

  try {
    let result: { stdout: string; stderr: string; exitCode: number; executionTime: number };

    if (language === "python" || language === "python3") {
      const filePath = join(tempDir, `code_${timestamp}.py`);
      writeFileSync(filePath, code);
      result = await runWithTimeout(`python3 "${filePath}"`, stdin, 5000);
      try { unlinkSync(filePath); } catch {}
    } else if (language === "javascript" || language === "js" || language === "nodejs") {
      const filePath = join(tempDir, `code_${timestamp}.js`);
      writeFileSync(filePath, code);
      result = await runWithTimeout(`node "${filePath}"`, stdin, 5000);
      try { unlinkSync(filePath); } catch {}
    } else if (language === "typescript" || language === "ts") {
      const filePath = join(tempDir, `code_${timestamp}.ts`);
      writeFileSync(filePath, code);
      result = await runWithTimeout(`npx --yes tsx "${filePath}"`, stdin, 15000);
      try { unlinkSync(filePath); } catch {}
    } else if (language === "bash" || language === "shell") {
      const filePath = join(tempDir, `code_${timestamp}.sh`);
      writeFileSync(filePath, code, { mode: 0o755 });
      result = await runWithTimeout(`bash "${filePath}"`, stdin, 5000);
      try { unlinkSync(filePath); } catch {}
    } else {
      result = {
        stdout: "",
        stderr: `Language "${language}" is not supported for server-side execution. Supported: python, javascript, typescript, bash.`,
        exitCode: 1,
        executionTime: 0,
      };
    }

    res.json(RunCodeResponse.parse(result));
  } catch (err) {
    logger.error({ err }, "Code execution error");
    res.json(
      RunCodeResponse.parse({
        stdout: "",
        stderr: "Internal execution error",
        exitCode: 1,
        executionTime: null,
      })
    );
  }
});

export default router;
