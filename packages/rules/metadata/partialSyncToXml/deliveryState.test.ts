import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { hashFileBytes, type ConfigurationIndexPendingDelta } from "@nkdk/runtime"
import {
  pendingPartialXmlSyncPaths,
  readPendingPartialXmlSync,
  writePendingPartialXmlSync,
  type PendingPartialXmlSyncStateV2,
} from "./pendingStore"
import {
  markPartialSyncApplied,
  markPartialSyncPreparedAfterRejection,
  markPartialSyncTransferring,
} from "./deliveryState"

describe("фазы передачи частичного XML-пакета", () => {
  const tempDirs: string[] = []
  afterEach(cleanTempDirs)

  it("проводит подготовленный пакет через передачу, отказ и успешное применение", async () => {
    const projectDir = await prepare()
    const transition = {
      projectDir,
      componentPath: "cf",
      packageId: "package-1",
      attemptId: "attempt-1",
    }
    const operationLogProjectPath = ".nkdk/tmp/sync-to-infobase/attempt-1/platform.log"

    await markPartialSyncTransferring({ ...transition, operationLogProjectPath })
    expect((await readPendingPartialXmlSync(projectDir, "cf"))?.delivery).toEqual({
      status: "transferring",
      attemptId: "attempt-1",
      operationLogProjectPath,
    })
    await markPartialSyncPreparedAfterRejection(transition)
    expect((await readPendingPartialXmlSync(projectDir, "cf"))?.delivery).toEqual({ status: "prepared" })
    await markPartialSyncTransferring({ ...transition, operationLogProjectPath })
    await markPartialSyncApplied(transition)
    expect((await readPendingPartialXmlSync(projectDir, "cf"))?.delivery).toEqual({
      status: "applied",
      attemptId: "attempt-1",
      operationLogProjectPath,
    })
  })

  it.each([
    ["wrong-package", "attempt-1"],
    ["package-1", "wrong-attempt"],
  ])("не меняет состояние при неверной идентичности %s/%s", async (packageId, attemptId) => {
    const projectDir = await prepare()
    const operationLogProjectPath = ".nkdk/tmp/sync-to-infobase/attempt-1/platform.log"
    await markPartialSyncTransferring({
      projectDir,
      componentPath: "cf",
      packageId: "package-1",
      attemptId: "attempt-1",
      operationLogProjectPath,
    })
    const pendingPath = pendingPartialXmlSyncPaths(projectDir, "cf").pendingPath
    const before = fs.readFileSync(pendingPath)

    await expect(markPartialSyncApplied({
      projectDir,
      componentPath: "cf",
      packageId,
      attemptId,
    })).rejects.toThrow(/идентификатор/i)
    expect(fs.readFileSync(pendingPath)).toEqual(before)
  })

  async function prepare(): Promise<string> {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-delivery-state-"))
    tempDirs.push(projectDir)
    const archive = writeArchive(projectDir)
    const state: PendingPartialXmlSyncStateV2 = {
      version: 3,
      packageId: "package-1",
      componentPath: "cf",
      archiveProjectPath: archive.projectPath,
      archiveHash: hashHex(archive.bytes),
      candidateAppliedMigrations: [],
      entries: ["Catalogs/Test.xml", "load.lst"],
      loadTargets: ["Catalogs/Test.xml"],
      delivery: { status: "prepared" },
    }
    await writePendingPartialXmlSync({ projectDir, state, delta: emptyDelta() })
    return projectDir
  }

  async function cleanTempDirs(): Promise<void> {
    await Promise.all(tempDirs.splice(0).map((dir) =>
      fs.promises.rm(dir, { recursive: true, force: true })))
  }
})

function writeArchive(projectDir: string): { projectPath: string; bytes: Buffer } {
  const projectPath = ".nkdk/tmp/incremental-sync/cf/package-1.zip"
  const absolutePath = join(projectDir, ...projectPath.split("/"))
  const bytes = Buffer.from("archive")
  fs.mkdirSync(join(absolutePath, ".."), { recursive: true })
  fs.writeFileSync(absolutePath, bytes)
  return { projectPath, bytes }
}

function hashHex(bytes: Uint8Array): string {
  return hashFileBytes(bytes).toString(16).padStart(16, "0")
}

function emptyDelta(): ConfigurationIndexPendingDelta {
  return { hashes: new Map(), blocks: new Map() }
}
