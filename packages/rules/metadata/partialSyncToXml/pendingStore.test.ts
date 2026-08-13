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

  it("блокирует обычную синхронизацию, даже если осталась только LMDB-дельта", async () => {
    const projectDir = tempProject()
    const state = createState(projectDir, "first")
    await writePendingPartialXmlSync({ projectDir, state, delta: sampleDelta() })
    fs.rmSync(pendingPartialXmlSyncPaths(projectDir, "cf").pendingPath)

    expect(() => assertNoPendingPartialXmlSync(projectDir, "cf")).toThrow(/ожидающий пакет/i)
  })

  it("принудительно очищает LMDB-дельту, manifest и ZIP", async () => {
    const projectDir = tempProject()
    const state = createState(projectDir, "first")
    await writePendingPartialXmlSync({ projectDir, state, delta: sampleDelta() })

    await forceClearPendingPartialXmlSync(projectDir, "cf")

    expect(await readPendingPartialXmlSync(projectDir, "cf")).toBeUndefined()
    expect(fs.existsSync(join(projectDir, ...state.archiveProjectPath.split("/")))).toBe(false)
    expect(() => assertNoPendingPartialXmlSync(projectDir, "cf")).not.toThrow()
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
