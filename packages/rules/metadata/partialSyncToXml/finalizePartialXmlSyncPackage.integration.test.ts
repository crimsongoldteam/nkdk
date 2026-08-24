import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { Uint8ArrayReader, Uint8ArrayWriter, ZipReader } from "@zip.js/zip.js"
import { afterEach, describe, expect, it } from "vitest"
import {
  hashFileBytes,
} from "@nkdk/runtime"
import {
  configurationIndexStoreDescriptor,
  type ConfigurationIndexStore,
} from "@nkdk/runtime/configuration-index-store"
import { finalizePartialXmlSyncPackage } from "./finalizePartialXmlSyncPackage"
import {
  partialXmlSyncArchiveProjectPath,
  pendingPartialXmlSyncPaths,
  type PendingPartialXmlSyncStateV3,
} from "./pendingStore"
import { createPartialXmlArchiveWriter } from "./archiveWriter"
import { buildPartialXmlAnomalyTestDocument } from "./tests/xmlAnomalyTestHelper"
import { writePartialXmlSyncWorkerBatch } from "./workerBatch"

describe("фиксация частичной XML-синхронизации", () => {
  const tempDirs: string[] = []
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => fs.promises.rm(dir, { recursive: true, force: true })))
  })

  it("публикует partial ZIP с XML, восстановленным общим адаптером аномалий", async () => {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-finalize-partial-anomaly-"))
    tempDirs.push(projectDir)
    const packageId = "anomaly-package"
    const archiveProjectPath = partialXmlSyncArchiveProjectPath("cf", packageId)
    const archivePath = join(projectDir, ...archiveProjectPath.split("/"))
    const writer = createPartialXmlArchiveWriter({ archivePath })
    const document = buildPartialXmlAnomalyTestDocument()
    const writtenPayloadPaths = new Set<string>()
    await writePartialXmlSyncWorkerBatch({
      batch: { generatedDocuments: [document], configurationFragments: [] },
      writer,
      writtenPayloadPaths,
      rebuiltBlocks: new Map(),
    })
    const archive = await writer.close([document.targetXmlPath])
    const state: PendingPartialXmlSyncStateV3 = {
      version: 3,
      packageId,
      componentPath: "cf",
      archiveProjectPath,
      archiveHash: archive.archiveHash.toString(16).padStart(16, "0"),
      candidateAppliedMigrations: [],
      entries: archive.entries,
      loadTargets: [document.targetXmlPath],
      delivery: {
        status: "applied",
        attemptId: "attempt-1",
        operationLogProjectPath: ".nkdk/tmp/sync-to-infobase/attempt-1/platform.log",
      },
    }
    const pendingPath = pendingPartialXmlSyncPaths(projectDir, "cf").pendingPath
    fs.mkdirSync(join(pendingPath, ".."), { recursive: true })
    fs.writeFileSync(pendingPath, `${JSON.stringify(state)}\n`)
    let appliedXml = ""
    const store = fakeStore([], {
      async applyPending() {
        appliedXml = await readZipText(archivePath, document.targetXmlPath)
      },
    })

    await finalizePartialXmlSyncPackage({ projectDir, componentPath: "cf", packageId }, {
      openStore: () => store,
      async publishMigrations() {},
    })

    expect(appliedXml).toContain("<Value>01</Value>")
    expect(appliedXml).not.toContain("ordinary")
    expect(fs.existsSync(archivePath)).toBe(false)
  })

  it("применяет дельту, публикует migration, очищает pending и затем удаляет транспорт", async () => {
    const prepared = prepare()
    const events: string[] = []
    const store = fakeStore(events)

    const result = await finalizePartialXmlSyncPackage({
      projectDir: prepared.projectDir,
      componentPath: "cf",
      packageId: "package-1",
    }, {
      openStore: () => store,
      async publishMigrations() { events.push("migrations") },
    })

    expect(events).toEqual(["already?", "apply", "migrations", "clear", "close"])
    expect(result).toEqual({
      status: "published",
      configurationIndexPath: configurationIndexStoreDescriptor(
        prepared.projectDir,
        { kind: "configuration" },
      ).dataPath,
    })
    expect(fs.existsSync(prepared.archivePath)).toBe(false)
    expect(fs.existsSync(prepared.pendingPath)).toBe(false)
  })

  it("после сбоя migration повторяет фиксацию без повторного применения дельты", async () => {
    const prepared = prepare()
    let applied = false
    const events: string[] = []
    const store = fakeStore(events, {
      pendingAlreadyApplied: () => { events.push("already?"); return applied },
      applyPending: async () => { events.push("apply"); applied = true },
    })

    await expect(finalizePartialXmlSyncPackage({
      projectDir: prepared.projectDir,
      componentPath: "cf",
      packageId: "package-1",
    }, {
      openStore: () => store,
      async publishMigrations() { throw new Error("migration write failed") },
    })).rejects.toThrow("migration write failed")
    expect(fs.existsSync(prepared.pendingPath)).toBe(true)

    events.length = 0
    const result = await finalizePartialXmlSyncPackage({
      projectDir: prepared.projectDir,
      componentPath: "cf",
      packageId: "package-1",
    }, {
      openStore: () => store,
      async publishMigrations() { events.push("migrations") },
    })

    expect(result.status).toBe("alreadyPublished")
    expect(events).toEqual(["already?", "migrations", "clear", "close"])
  })

  it.each([
    ["another-package", false, /идентификатор/i],
    ["package-1", true, /архив/i],
  ] as const)("сохраняет pending при неверном состоянии", async (packageId, damageArchive, error) => {
    const prepared = prepare()
    if (damageArchive) fs.writeFileSync(prepared.archivePath, "damaged")

    await expect(finalizePartialXmlSyncPackage({
      projectDir: prepared.projectDir,
      componentPath: "cf",
      packageId,
    }, { openStore: () => fakeStore([]) })).rejects.toThrow(error)
    expect(fs.existsSync(prepared.pendingPath)).toBe(true)
  })

  it.each(["prepared", "transferring"] as const)("не фиксирует пакет в фазе %s", async (status) => {
    const prepared = prepare(status)

    await expect(finalizePartialXmlSyncPackage({
      projectDir: prepared.projectDir,
      componentPath: "cf",
      packageId: "package-1",
    }, { openStore: () => fakeStore([]) })).rejects.toThrow(/успешн.*передач/i)
    expect(fs.existsSync(prepared.pendingPath)).toBe(true)
  })

  function prepare(deliveryStatus: "prepared" | "transferring" | "applied" = "applied") {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-finalize-partial-"))
    tempDirs.push(projectDir)
    const archiveProjectPath = partialXmlSyncArchiveProjectPath("cf", "package-1")
    const archivePath = join(projectDir, ...archiveProjectPath.split("/"))
    fs.mkdirSync(join(archivePath, ".."), { recursive: true })
    fs.writeFileSync(archivePath, "archive")
    const delivery = deliveryStatus === "prepared"
      ? { status: "prepared" as const }
      : {
          status: deliveryStatus,
          attemptId: "attempt-1",
          operationLogProjectPath: ".nkdk/tmp/sync-to-infobase/attempt-1/platform.log",
        }
    const state: PendingPartialXmlSyncStateV3 = {
      version: 3,
      packageId: "package-1",
      componentPath: "cf",
      archiveProjectPath,
      archiveHash: hashFileBytes(fs.readFileSync(archivePath)).toString(16).padStart(16, "0"),
      candidateAppliedMigrations: ["2026-06-30-120000.yaml"],
      entries: ["Catalogs/Test.xml", "load.lst"],
      loadTargets: ["Catalogs/Test.xml"],
      delivery,
    }
    const pendingPath = pendingPartialXmlSyncPaths(projectDir, "cf").pendingPath
    fs.mkdirSync(join(pendingPath, ".."), { recursive: true })
    fs.writeFileSync(pendingPath, `${JSON.stringify(state)}\n`)
    return { projectDir, archivePath, pendingPath }
  }
})

async function readZipText(archivePath: string, name: string): Promise<string> {
  const reader = new ZipReader(new Uint8ArrayReader(fs.readFileSync(archivePath)), { useWebWorkers: false })
  try {
    const entry = (await reader.getEntries()).find((candidate) => candidate.filename === name)
    if (entry?.directory !== false) throw new Error(`Не найден XML в ZIP: ${name}`)
    return new TextDecoder().decode(await entry.getData(new Uint8ArrayWriter()))
  } finally {
    await reader.close()
  }
}

function fakeStore(
  events: string[],
  overrides: Partial<ConfigurationIndexStore> = {},
): ConfigurationIndexStore {
  return {
    descriptor: () => ({ dataPath: "/index.lmdb", lockPath: "/index.lmdb-lock", schemaVersion: 1 }),
    readHashes: () => [],
    getBlocks: () => new Map(),
    hasBlock: () => false,
    hasPending: () => true,
    async replaceActiveFrom() {},
    async publishImportedCandidate() {},
    async writePending() {},
    pendingAlreadyApplied: () => { events.push("already?"); return false },
    async applyPending() { events.push("apply") },
    async clearPending() { events.push("clear") },
    async flush() {},
    async close() { events.push("close") },
    ...overrides,
  }
}
