import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"
import {
  createProjectValidationWorkerPool,
  partitionPendingReferencesForWorkers,
} from "./projectValidationWorkerPool"
import type { PendingMetadataTargetReference } from "./projectMetadataReferences"

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

  it("runs second pass through shared snapshots without opt-in environment flags", async () => {
    const pool = createProjectValidationWorkerPool({ concurrency: 1 })
    try {
      await pool.start()
      const second = await pool.runSecondPass({
        projectDir: "/project",
        context: {
          version: "2.20",
          defaultLanguage: "ru",
          exportToYAML: { toTyped: false },
        },
        mode: "full",
        objectTable: {
          records: [],
          filePaths: [],
          objectIndexEntries: [],
          memberIndexEntries: [],
          valueIndexEntries: [],
          pendingReferences: [],
        },
      })

      expect(second.diagnostics).toEqual([])
    } finally {
      await pool.close()
    }
  })
})

describe("partitionPendingReferencesForWorkers", () => {
  it("partitions pending references by count instead of file ownership", () => {
    const references = Array.from({ length: 7 }, (_, index) => pendingReference(index))

    expect(partitionPendingReferencesForWorkers(references, 3).map((items) => items.length)).toEqual([3, 2, 2])
  })
})

function pendingReference(index: number): PendingMetadataTargetReference {
  return {
    filePath: `/tmp/${index}.yaml`,
    yamlPath: ["Состав", index],
    canonical: `Catalog.Номенклатура.Attribute.Поле${index}`,
    target: {
      kind: "member",
      root: "Catalog",
      objectName: "Номенклатура",
      segments: [{ kind: "Attribute", name: `Поле${index}` }],
    },
    constraint: { kind: "member", owner: "explicit" },
  }
}
