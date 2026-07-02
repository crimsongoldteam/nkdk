import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"
import { createProjectValidationWorkerPool } from "./projectValidationWorkerPool"

const execFileAsync = promisify(execFile)

describe("ProjectValidationWorkerPool", () => {
  it("starts and stops worker threads", async () => {
    const pool = createProjectValidationWorkerPool({ concurrency: 2 })

    await pool.start()
    await pool.close()

    expect(pool.size()).toBe(2)
  })

  it("starts from plain tsx without legacy path aliases", async () => {
    const script = [
      'const { createProjectValidationWorkerPool } = await import("./metadata/validation/projectValidationWorkerPool.ts")',
      "const pool = createProjectValidationWorkerPool({ concurrency: 1 })",
      "await pool.start()",
      "console.log(`worker-size=${pool.size()}`)",
      "await pool.close()",
    ].join(";")

    const { stdout } = await execFileAsync(process.execPath, ["--import", "tsx", "-e", script], {
      cwd: process.cwd(),
      env: { ...process.env, NODE_OPTIONS: "" },
    })

    expect(stdout.trim()).toBe("worker-size=1")
  })
})
