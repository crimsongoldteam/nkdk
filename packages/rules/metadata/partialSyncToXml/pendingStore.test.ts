import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  hashFileBytes,
} from "@nkdk/runtime"
import {
  configurationIndexStoreDescriptor,
  openConfigurationIndexStore,
  type ConfigurationIndexPendingDelta,
} from "@nkdk/runtime/configuration-index-store"
import {
  assertNoPendingPartialXmlSync,
  cleanupPendingPartialXmlSync,
  forceClearPendingPartialXmlSync,
  partialXmlSyncArchiveProjectPath,
  pendingPartialXmlSyncPaths,
  readPendingPartialXmlSync,
  writePendingPartialXmlSync,
  type PendingPartialXmlSyncStateV3,
} from "./pendingStore"

describe("ожидающее состояние частичной XML-синхронизации", () => {
  const tempDirs: string[] = []
  afterEach(() => {
    while (tempDirs.length > 0) fs.rmSync(tempDirs.pop()!, { recursive: true, force: true })
  })

  it("пишет LMDB-дельту раньше manifest без отдельного snapshot-кандидата", async () => {
    const projectDir = tempProject()
    const state = createState(projectDir, "first")
    let pendingObservedBeforeManifest = false

    await writePendingPartialXmlSync({ projectDir, state, delta: sampleDelta() }, {
      async writeAtomic(path, bytes) {
        const store = openConfigurationIndexStore(
          configurationIndexStoreDescriptor(projectDir, { kind: "configuration" }),
          "readOnly",
        )
        try { pendingObservedBeforeManifest = store.hasPending() } finally { await store.close() }
        await fs.promises.mkdir(join(path, ".."), { recursive: true })
        await fs.promises.writeFile(path, bytes)
      },
    })

    const paths = pendingPartialXmlSyncPaths(projectDir, "cf")
    expect(pendingObservedBeforeManifest).toBe(true)
    expect(await readPendingPartialXmlSync(projectDir, "cf")).toEqual(state)
    expect(JSON.parse(fs.readFileSync(paths.pendingPath, "utf8"))).toMatchObject({
      version: 3,
      delivery: { status: "prepared" },
    })
    expect(fs.readdirSync(join(projectDir, ".nkdk", "components", "cf", "partial-sync")))
      .toEqual(["pending.json"])
  })

  it("не заменяет существующий pending-пакет", async () => {
    const projectDir = tempProject()
    const first = createState(projectDir, "first")
    await writePendingPartialXmlSync({ projectDir, state: first, delta: sampleDelta() })
    const second = createState(projectDir, "second")

    await expect(writePendingPartialXmlSync({ projectDir, state: second, delta: sampleDelta() }))
      .rejects.toThrow(/ожидающий пакет/i)
    expect((await readPendingPartialXmlSync(projectDir, "cf"))?.packageId).toBe("first")
  })

  it("при очистке временных файлов сохраняет чужой pending-пакет", async () => {
    const projectDir = tempProject()
    const first = createState(projectDir, "first")
    const paths = pendingPartialXmlSyncPaths(projectDir, "cf")
    fs.mkdirSync(join(paths.pendingPath, ".."), { recursive: true })
    fs.writeFileSync(paths.pendingPath, JSON.stringify(first))
    const orphanPath = join(projectDir, ...partialXmlSyncArchiveProjectPath("cf", "orphan").split("/"))
    fs.writeFileSync(orphanPath, "orphan")

    await cleanupPendingPartialXmlSync(projectDir, "cf")

    expect((await readPendingPartialXmlSync(projectDir, "cf"))?.packageId).toBe("first")
    expect(fs.existsSync(join(projectDir, ...first.archiveProjectPath.split("/")))).toBe(true)
    expect(fs.existsSync(orphanPath)).toBe(false)
  })

  it("блокирует обычную синхронизацию, даже если осталась только LMDB-дельта", async () => {
    const projectDir = tempProject()
    const state = createState(projectDir, "first")
    await writePendingPartialXmlSync({ projectDir, state, delta: sampleDelta() })
    fs.rmSync(pendingPartialXmlSyncPaths(projectDir, "cf").pendingPath)

    await expect(assertNoPendingPartialXmlSync(projectDir, "cf")).rejects.toThrow(/ожидающий пакет/i)
  })

  it("принудительно очищает LMDB-дельту, manifest и ZIP", async () => {
    const projectDir = tempProject()
    const state = createState(projectDir, "first")
    await writePendingPartialXmlSync({ projectDir, state, delta: sampleDelta() })

    await forceClearPendingPartialXmlSync(projectDir, "cf")

    expect(await readPendingPartialXmlSync(projectDir, "cf")).toBeUndefined()
    expect(fs.existsSync(join(projectDir, ...state.archiveProjectPath.split("/")))).toBe(false)
    await expect(assertNoPendingPartialXmlSync(projectDir, "cf")).resolves.toBeUndefined()
  })

  it("принудительно очищает состояние при повреждённом manifest", async () => {
    const projectDir = tempProject()
    const paths = pendingPartialXmlSyncPaths(projectDir, "cf")
    const archiveProjectPath = partialXmlSyncArchiveProjectPath("cf", "first")
    const archivePath = join(projectDir, ...archiveProjectPath.split("/"))
    fs.mkdirSync(join(archivePath, ".."), { recursive: true })
    fs.writeFileSync(archivePath, "first")
    fs.mkdirSync(join(paths.pendingPath, ".."), { recursive: true })
    fs.writeFileSync(paths.pendingPath, "{")

    await expect(forceClearPendingPartialXmlSync(projectDir, "cf")).resolves.toBeUndefined()

    expect(fs.existsSync(paths.pendingPath)).toBe(false)
    expect(fs.existsSync(archivePath)).toBe(false)
    await expect(assertNoPendingPartialXmlSync(projectDir, "cf")).resolves.toBeUndefined()
  })

  it("отклоняет лишние поля manifest версии 3", async () => {
    const projectDir = tempProject()
    const state = createState(projectDir, "first")
    const paths = pendingPartialXmlSyncPaths(projectDir, "cf")
    fs.mkdirSync(join(paths.pendingPath, ".."), { recursive: true })
    fs.writeFileSync(paths.pendingPath, JSON.stringify({ ...state, candidateSnapshotHash: "0000000000000001" }))

    await expect(readPendingPartialXmlSync(projectDir, "cf")).rejects.toThrow(/лишн.*пол/i)
  })

  it("ожидает закрытие LMDB и возвращает ошибку закрытия", async () => {
    const projectDir = tempProject()
    const descriptor = configurationIndexStoreDescriptor(projectDir, { kind: "configuration" })
    fs.mkdirSync(descriptor.dataPath, { recursive: true })
    const closeFailure = new Error("close failed")

    await expect(assertNoPendingPartialXmlSync(projectDir, "cf", () => ({
      hasPending: () => false,
      async close() { throw closeFailure },
    }))).rejects.toBe(closeFailure)
  })

  function tempProject(): string {
    const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-pending-partial-"))
    tempDirs.push(dir)
    return dir
  }
})

function sampleDelta(): ConfigurationIndexPendingDelta {
  return {
    hashes: new Map([["Справочники/Тест.yaml", { kind: "put", contentHash: 2n }]]),
    blocks: new Map([["Справочники/Тест.yaml", {
      kind: "put",
      block: { entities: [{ logicalAddress: "Справочник.Тест", uuid: "11111111-1111-4111-8111-111111111111" }] },
    }]]),
  }
}

function createState(projectDir: string, packageId: string): PendingPartialXmlSyncStateV3 {
  const archiveProjectPath = partialXmlSyncArchiveProjectPath("cf", packageId)
  const archivePath = join(projectDir, ...archiveProjectPath.split("/"))
  fs.mkdirSync(join(archivePath, ".."), { recursive: true })
  fs.writeFileSync(archivePath, packageId)
  return {
    version: 3,
    packageId,
    componentPath: "cf",
    archiveProjectPath,
    archiveHash: hashFileBytes(fs.readFileSync(archivePath)).toString(16).padStart(16, "0"),
    candidateAppliedMigrations: [],
    entries: ["Catalogs/Test.xml", "load.lst"],
    loadTargets: ["Catalogs/Test.xml"],
    delivery: { status: "prepared" },
  }
}
