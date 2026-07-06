import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"
import {
  createProjectValidationWorkerPool,
  partitionPendingReferencesForWorkers,
} from "./projectValidationWorkerPool"
import type { PendingMetadataTargetReference } from "./projectMetadataReferences"

const execFileAsync = promisify(execFile)
const context = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
} as const

describe("ProjectValidationWorkerPool", () => {
  it("does not retain YAML entries or model state after worker validation", async () => {
    const worker = await import("./projectValidationWorker")

    expect(worker.workerStateStatsForTests()).toEqual({
      retainedEntries: 0,
      retainedStates: 0,
      retainedPropertyModels: 0,
      retainedFormStates: 0,
    })
  })

  it("starts and initializes worker schema caches", async () => {
    const pool = createProjectValidationWorkerPool({ concurrency: 1 })

    try {
      const profile = await pool.start(context)

      expect(pool.size()).toBe(1)
      expect(profile.workerInitMs).toBeGreaterThanOrEqual(0)
      expect(profile.schemaCompileMs).toBeGreaterThanOrEqual(0)
      expect(profile.formSchemaMs).toBeGreaterThanOrEqual(0)
      expect(profile.propertiesSchemaMs).toBeGreaterThanOrEqual(0)
    } finally {
      await pool.close()
    }
  }, 120_000)

  it("reuses initialized worker schema caches on repeated start", async () => {
    const pool = createProjectValidationWorkerPool({ concurrency: 1 })

    try {
      const first = await pool.start(context)
      const second = await pool.start(context)

      expect(first.reused).toBeUndefined()
      expect(second).toMatchObject({
        reused: true,
        schemaCompileMs: first.schemaCompileMs,
        formSchemaMs: first.formSchemaMs,
        propertiesSchemaMs: first.propertiesSchemaMs,
      })
    } finally {
      await pool.close()
    }
  }, 120_000)

  it("starts from plain tsx without legacy path aliases", async () => {
    const script = [
      'const { createProjectValidationWorkerPool } = await import("./metadata/validation/projectValidationWorkerPool.ts")',
      "const pool = createProjectValidationWorkerPool({ concurrency: 1 })",
      "await pool.start({ version: '2.20', defaultLanguage: 'ru', exportToYAML: { toTyped: false } })",
      "console.log(`worker-size=${pool.size()}`)",
      "await pool.close()",
    ].join(";")

    const { stdout } = await execFileAsync(process.execPath, ["--import", "tsx", "-e", script], {
      cwd: process.cwd(),
      env: { ...process.env, NODE_OPTIONS: "" },
    })

    expect(stdout.trim()).toBe("worker-size=1")
  }, 120_000)

  it("runs second pass through shared snapshots without opt-in environment flags", async () => {
    const pool = createProjectValidationWorkerPool({ concurrency: 1 })
    try {
      await pool.start(context)
      const second = await pool.runSecondPass({
        projectDir: "/project",
        context,
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
  }, 120_000)
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
