import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"
import {
  createProjectValidationWorkerPool,
  createWorkerTableSupplement,
  partitionPendingReferencesForWorkers,
} from "./projectValidationWorkerPool"
import type { PendingMetadataTargetReference } from "./projectMetadataReferences"
import type { ValidationObjectRecord, ValidationObjectTableSnapshot } from "./projectValidationTypes"

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

describe("createWorkerTableSupplement", () => {
  it("excludes records and file paths already owned by the worker", () => {
    const local = record({ kind: "Справочник", name: "Товары" }, "/project/Справочник/Товары/Свойства.yaml")
    const remote = record({ kind: "Документ", name: "Заказ" }, "/project/Документ/Заказ/Свойства.yaml")
    const snapshot: ValidationObjectTableSnapshot = {
      records: [local, remote],
      filePaths: [local.filePath, remote.filePath],
    }

    const supplement = createWorkerTableSupplement(snapshot, new Set([local.filePath]))

    expect(supplement).toEqual({
      records: [remote],
      filePaths: [remote.filePath],
    })
  })

  it("keeps remote owner records when they override a local owner key", () => {
    const local = record(
      { kind: "Подсистема", name: "Настройки" },
      "/project/Подсистема/A/Подсистемы/Настройки/Свойства.yaml"
    )
    const remote = record(
      { kind: "Подсистема", name: "Настройки" },
      "/project/Подсистема/B/Подсистемы/Настройки/Свойства.yaml"
    )
    const snapshot: ValidationObjectTableSnapshot = {
      records: [remote],
      filePaths: [local.filePath, remote.filePath],
    }

    const supplement = createWorkerTableSupplement(snapshot, new Set([local.filePath]))

    expect(supplement).toEqual({
      records: [remote],
      filePaths: [remote.filePath],
    })
  })
})

describe("partitionPendingReferencesForWorkers", () => {
  it("partitions pending references by count instead of file ownership", () => {
    const references = Array.from({ length: 7 }, (_, index) => pendingReference(index))

    expect(partitionPendingReferencesForWorkers(references, 3).map((items) => items.length)).toEqual([3, 2, 2])
  })
})

function record(owner: { kind: string; name: string }, filePath: string): ValidationObjectRecord {
  return {
    filePath,
    projectPath: filePath.replace(/^\/project\//, ""),
    kind: "properties",
    owner: { dir: owner.kind, name: owner.name },
    ownerRef: { kind: owner.kind, name: owner.name },
    model: { itemType: owner.kind, name: owner.name },
    importDiagnostics: [],
  }
}

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
