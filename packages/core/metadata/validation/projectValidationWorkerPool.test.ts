import { describe, expect, it } from "vitest"
import { createProjectValidationWorkerPool } from "./projectValidationWorkerPool"

describe("ProjectValidationWorkerPool", () => {
  it("starts and stops worker threads", async () => {
    const pool = createProjectValidationWorkerPool({ concurrency: 2 })

    await pool.start()
    await pool.close()

    expect(pool.size()).toBe(2)
  })
})
