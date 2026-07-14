import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
  createProjectValidationWorkerPool,
  partitionPendingReferencesForWorkers,
  type ProjectValidationWorkerPool,
  type ProjectValidationWorkerPoolStartProfile,
} from "./projectValidationWorkerPool"
import type { PendingMetadataTargetReference } from "./projectMetadataReferences"

const context = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
} as const

describe("ProjectValidationWorkerPool", () => {
  let pool: ProjectValidationWorkerPool
  let firstStartProfile: ProjectValidationWorkerPoolStartProfile

  beforeAll(async () => {
    pool = createProjectValidationWorkerPool({ concurrency: 1 })
    firstStartProfile = await pool.start(context)
  }, 120_000)

  afterAll(async () => {
    await pool.close()
  })

  it("does not retain YAML entries or model state after worker validation", async () => {
    const worker = await import("./projectValidationWorker")

    expect(worker.workerStateStatsForTests()).toEqual({
      retainedEntries: 0,
      retainedStates: 0,
      retainedPropertyModels: 0,
      retainedFormStates: 0,
    })
  })

  it("starts and initializes worker schema caches", () => {
    expect(pool.size()).toBe(1)
    expect(firstStartProfile.workerInitMs).toBeGreaterThanOrEqual(0)
    expect(firstStartProfile.schemaCompileMs).toBeGreaterThanOrEqual(0)
    expect(firstStartProfile.formSchemaMs).toBeGreaterThanOrEqual(0)
    expect(firstStartProfile.propertiesSchemaMs).toBeGreaterThanOrEqual(0)
  })

  it("reuses initialized worker schema caches on repeated start", async () => {
    const second = await pool.start(context)

    expect(firstStartProfile.reused).toBeUndefined()
    expect(second).toMatchObject({
      reused: true,
      schemaCompileMs: firstStartProfile.schemaCompileMs,
      formSchemaMs: firstStartProfile.formSchemaMs,
      propertiesSchemaMs: firstStartProfile.propertiesSchemaMs,
    })
  })

  it("runs second pass through shared snapshots without opt-in environment flags", async () => {
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
  })
})

describe("partitionPendingReferencesForWorkers", () => {
  it("partitions pending references by count instead of file ownership", () => {
    const references = Array.from({ length: 7 }, (_, index) => pendingReference(index))

    expect(partitionPendingReferencesForWorkers(references, 3).map((items) => items.length)).toEqual([3, 2, 2])
  })
})

describe("resolveProjectValidationWorkerFile", () => {
  it("uses TypeScript worker next to source file", async () => {
    const { resolveProjectValidationWorkerFile } = await import("./projectValidationWorkerPool")

    const result = resolveProjectValidationWorkerFile(
      "/repo/packages/core/metadata/validation/projectValidationWorkerPool.ts"
    )

    expect(result).toBe("/repo/packages/core/metadata/validation/projectValidationWorker.ts")
  })

  it("uses JavaScript worker next to built core file", async () => {
    const { resolveProjectValidationWorkerFile } = await import("./projectValidationWorkerPool")

    const result = resolveProjectValidationWorkerFile("/repo/packages/core/dist/projectValidationWorkerPool.js")

    expect(result).toBe("/repo/packages/core/dist/projectValidationWorker.js")
  })

  it("uses parent dist worker for bundled MCP bin layout", async () => {
    const { resolveProjectValidationWorkerFile } = await import("./projectValidationWorkerPool")
    const existing = new Set([join("/repo/packages/mcp/dist", "projectValidationWorker.js")])

    const result = resolveProjectValidationWorkerFile("/repo/packages/mcp/dist/bin/nkdk-mcp", (path) =>
      existing.has(path)
    )

    expect(result).toBe("/repo/packages/mcp/dist/projectValidationWorker.js")
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
