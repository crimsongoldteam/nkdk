import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { decodeConfigurationIndex } from "@nkdk/runtime"
import { encodeConfigurationIndex } from "@nkdk/runtime"
import { configurationIndexPath } from "@nkdk/runtime"
import { hashFileBytes } from "@nkdk/runtime"
import type { ConfigurationSnapshot } from "@nkdk/runtime"
import { parseComponentPath } from "@nkdk/runtime"
import { finalizePartialXmlSyncPackage } from "./finalizePartialXmlSyncPackage"
import { markPartialSyncApplied, markPartialSyncTransferring } from "./deliveryState"
import { readPartialXmlSyncAppliedMigrations } from "./migrationState"
import {
  partialXmlSyncArchiveProjectPath,
  pendingPartialXmlSyncPaths,
  writePendingPartialXmlSync,
  type PendingPartialXmlSyncStateV2,
} from "./pendingStore"

describe("фиксация частичной XML-синхронизации", () => {
  const tempDirs: string[] = []
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => fs.promises.rm(dir, { recursive: true, force: true })))
  })

  it("публикует заранее подготовленный снимок и удаляет ожидающие файлы", async () => {
    const prepared = await prepare()
    fs.writeFileSync(join(prepared.projectDir, "changed-after-prepare.yaml"), "new change")

    const result = await finalizePartialXmlSyncPackage({
      projectDir: prepared.projectDir,
      componentPath: "cf",
      packageId: "package-1",
    })

    expect(result).toEqual({
      status: "published",
      configurationIndexPath: configurationIndexPath(prepared.projectDir, { kind: "configuration" }),
    })
    expect(decodeConfigurationIndex(fs.readFileSync(configurationIndexPath(
      prepared.projectDir,
      { kind: "configuration" },
    ))).indexGeneration).toBe(2n)
    expect(fs.existsSync(prepared.archivePath)).toBe(false)
    expect(fs.existsSync(prepared.paths.pendingPath)).toBe(false)
    expect(fs.existsSync(prepared.paths.candidatePath)).toBe(false)
  })

  it("после сбоя за публикацией снимка завершает ту же фиксацию без нового поколения", async () => {
    const prepared = await prepare()
    await expect(finalizePartialXmlSyncPackage({
      projectDir: prepared.projectDir,
      componentPath: "cf",
      packageId: "package-1",
    }, {
      async publishMigrations() { throw new Error("migration write failed") },
    })).rejects.toThrow("migration write failed")
    expect(fs.existsSync(prepared.paths.pendingPath)).toBe(true)

    const result = await finalizePartialXmlSyncPackage({
      projectDir: prepared.projectDir,
      componentPath: "cf",
      packageId: "package-1",
    })

    expect(result).toEqual({
      status: "alreadyPublished",
      configurationIndexPath: configurationIndexPath(prepared.projectDir, { kind: "configuration" }),
    })
    expect(decodeConfigurationIndex(fs.readFileSync(configurationIndexPath(
      prepared.projectDir,
      { kind: "configuration" },
    ))).indexGeneration).toBe(2n)
  })

  it("публикует проверенный список migration только при фиксации", async () => {
    const migrationName = "2026-06-30-120000.yaml"
    const prepared = await prepare("cf", [migrationName])
    expect(await readPartialXmlSyncAppliedMigrations(prepared.projectDir, "cf")).toEqual([])

    await finalizePartialXmlSyncPackage({
      projectDir: prepared.projectDir,
      componentPath: "cf",
      packageId: "package-1",
    })

    expect(await readPartialXmlSyncAppliedMigrations(prepared.projectDir, "cf")).toEqual([migrationName])
  })

  it.each([
    ["another-package", undefined, /идентификатор/i],
    ["package-1", "archive", /архив/i],
    ["package-1", "source", /исходн.*сним/i],
  ] as const)("отклоняет неверное состояние и сохраняет pending", async (packageId, damage, error) => {
    const prepared = await prepare()
    if (damage === "archive") fs.writeFileSync(prepared.archivePath, "damaged")
    if (damage === "source") fs.writeFileSync(
      configurationIndexPath(prepared.projectDir, { kind: "configuration" }),
      encodeConfigurationIndex(snapshot(3n)),
    )

    await expect(finalizePartialXmlSyncPackage({
      projectDir: prepared.projectDir,
      componentPath: "cf",
      packageId,
    })).rejects.toThrow(error)

    expect(fs.existsSync(prepared.paths.pendingPath)).toBe(true)
    expect(fs.existsSync(prepared.paths.candidatePath)).toBe(true)
  })

  it("не публикует пакет расширения после изменения подтверждённого снимка cf", async () => {
    const prepared = await prepare("cfe/Продажи")
    fs.writeFileSync(
      configurationIndexPath(prepared.projectDir, { kind: "configuration" }),
      encodeConfigurationIndex(snapshot(6n)),
    )

    await expect(finalizePartialXmlSyncPackage({
      projectDir: prepared.projectDir,
      componentPath: "cfe/Продажи",
      packageId: "package-1",
    })).rejects.toThrow(/базов.*сним/i)

    expect(fs.existsSync(prepared.paths.pendingPath)).toBe(true)
  })

  it.each(["prepared", "transferring"] as const)(
    "не фиксирует пакет в фазе %s",
    async (deliveryStatus) => {
      const prepared = await prepare("cf", [], deliveryStatus)

      await expect(finalizePartialXmlSyncPackage({
        projectDir: prepared.projectDir,
        componentPath: "cf",
        packageId: "package-1",
      })).rejects.toThrow(/успешн.*передач/i)
      expect(fs.existsSync(prepared.paths.pendingPath)).toBe(true)
    }
  )

  async function prepare(
    componentPath = "cf",
    candidateAppliedMigrations: readonly string[] = [],
    deliveryStatus: "prepared" | "transferring" | "applied" = "applied",
  ) {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-finalize-partial-"))
    tempDirs.push(projectDir)
    const sourceBytes = encodeConfigurationIndex(snapshot(1n, componentPath))
    const candidateBytes = encodeConfigurationIndex(snapshot(2n, componentPath))
    const publishedPath = configurationIndexPath(projectDir, parseComponentPath(componentPath))
    fs.mkdirSync(join(publishedPath, ".."), { recursive: true })
    fs.writeFileSync(publishedPath, sourceBytes)
    let baseIdentity: { baseSnapshotHash: string; baseSnapshotGeneration: string } | undefined
    if (componentPath !== "cf") {
      const baseBytes = encodeConfigurationIndex(snapshot(5n))
      const basePath = configurationIndexPath(projectDir, { kind: "configuration" })
      fs.mkdirSync(join(basePath, ".."), { recursive: true })
      fs.writeFileSync(basePath, baseBytes)
      baseIdentity = { baseSnapshotHash: hashHex(baseBytes), baseSnapshotGeneration: "5" }
    }
    const archiveProjectPath = partialXmlSyncArchiveProjectPath(componentPath, "package-1")
    const archivePath = join(projectDir, ...archiveProjectPath.split("/"))
    fs.mkdirSync(join(archivePath, ".."), { recursive: true })
    fs.writeFileSync(archivePath, "archive")
    const state: PendingPartialXmlSyncStateV2 = {
      version: 2,
      packageId: "package-1",
      componentPath,
      archiveProjectPath,
      archiveHash: hashHex(fs.readFileSync(archivePath)),
      sourceSnapshotHash: hashHex(sourceBytes),
      sourceSnapshotGeneration: "1",
      candidateSnapshotHash: hashHex(candidateBytes),
      ...baseIdentity,
      candidateAppliedMigrations,
      delivery: { status: "prepared" },
    }
    await writePendingPartialXmlSync({ projectDir, state, candidateBytes })
    if (deliveryStatus !== "prepared") {
      await markPartialSyncTransferring({
        projectDir,
        componentPath,
        packageId: "package-1",
        attemptId: "attempt-1",
        operationLogProjectPath: ".nkdk/tmp/sync-to-infobase/attempt-1/platform.log",
      })
    }
    if (deliveryStatus === "applied") {
      await markPartialSyncApplied({
        projectDir,
        componentPath,
        packageId: "package-1",
        attemptId: "attempt-1",
      })
    }
    return { projectDir, archivePath, paths: pendingPartialXmlSyncPaths(projectDir, componentPath) }
  }
})

function snapshot(indexGeneration: bigint, componentPath = "cf"): ConfigurationSnapshot {
  return { specificationVersion: "1.4", indexGeneration, componentPath, files: [], entities: [] }
}

function hashHex(bytes: Uint8Array): string {
  return hashFileBytes(bytes).toString(16).padStart(16, "0")
}
