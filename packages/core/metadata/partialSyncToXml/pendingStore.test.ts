import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "@nkdk/runtime"
import { decodeConfigurationIndex } from "@nkdk/runtime"
import { hashFileBytes } from "@nkdk/runtime"
import type { ConfigurationSnapshot } from "@nkdk/runtime"
import {
  assertNoPendingPartialXmlSync,
  cleanupPendingPartialXmlSync,
  partialXmlSyncArchiveProjectPath,
  pendingPartialXmlSyncPaths,
  readPendingPartialXmlSync,
  writePendingPartialXmlSync,
  type PendingPartialXmlSyncStateV1,
} from "./pendingStore"

describe("ожидающее состояние частичной XML-синхронизации", () => {
  const tempDirs: string[] = []
  afterEach(() => {
    while (tempDirs.length > 0) fs.rmSync(tempDirs.pop()!, { recursive: true, force: true })
  })

  it("пишет кандидат раньше manifest и не изменяет опубликованный снимок", async () => {
    const projectDir = tempProject()
    const candidateBytes = encodeConfigurationIndex(snapshot(2n))
    const state = createState(projectDir, "first", candidateBytes)
    const writes: string[] = []

    await writePendingPartialXmlSync({ projectDir, state, candidateBytes }, {
      async writeAtomic(path, bytes) {
        writes.push(path)
        await fs.promises.mkdir(join(path, ".."), { recursive: true })
        await fs.promises.writeFile(path, bytes)
      },
    })

    const paths = pendingPartialXmlSyncPaths(projectDir, "cf")
    expect(writes).toEqual([paths.candidatePath, paths.pendingPath])
    expect(await readPendingPartialXmlSync(projectDir, "cf")).toEqual(state)
    expect(fs.readFileSync(paths.candidatePath)).toEqual(candidateBytes)
  })

  it("заменяет единственный предыдущий пакет и удаляет ZIP-сироты только своего компонента", async () => {
    const projectDir = tempProject()
    const firstBytes = encodeConfigurationIndex(snapshot(2n))
    const first = createState(projectDir, "first", firstBytes)
    await writePendingPartialXmlSync({ projectDir, state: first, candidateBytes: firstBytes })
    const firstArchive = join(projectDir, ...first.archiveProjectPath.split("/"))
    const orphan = join(firstArchive, "..", "orphan.zip")
    fs.writeFileSync(orphan, "orphan")
    const otherComponent = join(projectDir, ".nkdk", "tmp", "incremental-sync", "cfe", "Other", "keep.zip")
    fs.mkdirSync(join(otherComponent, ".."), { recursive: true })
    fs.writeFileSync(otherComponent, "keep")

    const secondBytes = encodeConfigurationIndex(snapshot(3n))
    const second = createState(projectDir, "second", secondBytes)
    await writePendingPartialXmlSync({ projectDir, state: second, candidateBytes: secondBytes })

    expect(fs.existsSync(firstArchive)).toBe(false)
    expect(fs.existsSync(orphan)).toBe(false)
    expect(fs.existsSync(otherComponent)).toBe(true)
    expect((await readPendingPartialXmlSync(projectDir, "cf"))?.packageId).toBe("second")
  })

  it("не доверяет пути повреждённого manifest и блокирует обычную синхронизацию", async () => {
    const projectDir = tempProject()
    const paths = pendingPartialXmlSyncPaths(projectDir, "cf")
    const outside = join(projectDir, "keep.zip")
    fs.mkdirSync(join(paths.pendingPath, ".."), { recursive: true })
    fs.writeFileSync(outside, "keep")
    fs.writeFileSync(paths.pendingPath, JSON.stringify({ version: 1, archiveProjectPath: "keep.zip" }))

    expect(() => assertNoPendingPartialXmlSync(projectDir, "cf")).toThrow(/ожидающий пакет/i)
    await cleanupPendingPartialXmlSync(projectDir, "cf")

    expect(fs.existsSync(outside)).toBe(true)
    expect(fs.existsSync(paths.pendingPath)).toBe(false)
  })

  function tempProject(): string {
    const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-pending-partial-"))
    tempDirs.push(dir)
    return dir
  }
})

function snapshot(indexGeneration: bigint): ConfigurationSnapshot {
  return { specificationVersion: "1.3", indexGeneration, componentPath: "cf", files: [], entities: [] }
}

function createState(
  projectDir: string,
  packageId: string,
  candidateBytes: Uint8Array,
): PendingPartialXmlSyncStateV1 {
  const archiveProjectPath = partialXmlSyncArchiveProjectPath("cf", packageId)
  const archivePath = join(projectDir, ...archiveProjectPath.split("/"))
  fs.mkdirSync(join(archivePath, ".."), { recursive: true })
  fs.writeFileSync(archivePath, packageId)
  return {
    version: 1,
    packageId,
    componentPath: "cf",
    archiveProjectPath,
    archiveHash: hashHex(fs.readFileSync(archivePath)),
    sourceSnapshotHash: "0000000000000001",
    sourceSnapshotGeneration: (decodeConfigurationIndex(candidateBytes).indexGeneration - 1n).toString(),
    candidateSnapshotHash: hashHex(candidateBytes),
    candidateAppliedMigrations: [],
  }
}

function hashHex(bytes: Uint8Array): string {
  return hashFileBytes(bytes).toString(16).padStart(16, "0")
}
