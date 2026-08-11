import fs from "node:fs"
import { resolve } from "node:path"
import { xxh3 } from "@node-rs/xxhash"
import { parseComponentPath } from "@nkdk/runtime"
import { decodeConfigurationIndex } from "@nkdk/runtime"
import { configurationIndexPath, writeConfigurationIndex } from "@nkdk/runtime"
import { hashFileBytes } from "@nkdk/runtime"
import type { ConfigurationSnapshot } from "@nkdk/runtime"
import {
  pendingPartialXmlSyncPaths,
  readPendingPartialXmlSync,
  type PendingPartialXmlSyncStateV1,
} from "./pendingStore"
import { publishPartialXmlSyncAppliedMigrations } from "./migrationState"

export interface FinalizePartialXmlSyncDependencies {
  readonly writeIndex?: (params: {
    readonly projectDir: string
    readonly address: ReturnType<typeof parseComponentPath>
    readonly data: ConfigurationSnapshot
  }) => Promise<void>
  readonly publishMigrations?: (params: {
    readonly projectDir: string
    readonly componentPath: string
    readonly applied: readonly string[]
  }) => Promise<void>
  readonly hashArchive?: (path: string) => Promise<bigint>
}

export async function finalizePartialXmlSyncPackage(
  params: {
    readonly projectDir: string
    readonly componentPath: string
    readonly packageId: string
  },
  dependencies: FinalizePartialXmlSyncDependencies = {},
): Promise<{ readonly status: "published" | "alreadyPublished" }> {
  const projectDir = resolve(params.projectDir)
  const address = parseComponentPath(params.componentPath)
  const pending = await readPendingPartialXmlSync(projectDir, params.componentPath)
  if (pending === undefined) throw new Error(`Нет ожидающего пакета для компонента ${params.componentPath}`)
  if (pending.packageId !== params.packageId) {
    throw new Error(`Не совпадает идентификатор ожидающего пакета: ${params.packageId}`)
  }

  const publishedPath = configurationIndexPath(projectDir, address)
  const publishedBytes = await fs.promises.readFile(publishedPath)
  const publishedHash = hashHex(publishedBytes)
  const published = decodeConfigurationIndex(publishedBytes, { expectedComponentPath: params.componentPath })
  const alreadyPublished = publishedHash === pending.candidateSnapshotHash

  if (!alreadyPublished) {
    assertSnapshotIdentity({
      name: "исходный снимок",
      actualHash: publishedHash,
      actualGeneration: published.indexGeneration,
      expectedHash: pending.sourceSnapshotHash,
      expectedGeneration: pending.sourceSnapshotGeneration,
    })
    await assertBaseSnapshotIdentity(projectDir, pending)
    const archivePath = projectPathToAbsolute(projectDir, pending.archiveProjectPath)
    const archiveHash = await (dependencies.hashArchive ?? hashArchive)(archivePath)
    if (hashHexFromBigInt(archiveHash) !== pending.archiveHash) {
      throw new Error("Хэш архива ожидающего пакета не совпадает")
    }
    const candidate = await readCandidate(projectDir, pending)
    await (dependencies.writeIndex ?? writeConfigurationIndex)({ projectDir, address, data: candidate })
  }

  await (dependencies.publishMigrations ?? publishPartialXmlSyncAppliedMigrations)({
    projectDir,
    componentPath: params.componentPath,
    applied: pending.candidateAppliedMigrations,
  })
  await removePublishedPendingFiles(projectDir, pending)
  return { status: alreadyPublished ? "alreadyPublished" : "published" }
}

async function readCandidate(
  projectDir: string,
  pending: PendingPartialXmlSyncStateV1,
): Promise<ConfigurationSnapshot> {
  const { candidatePath } = pendingPartialXmlSyncPaths(projectDir, pending.componentPath)
  const bytes = await fs.promises.readFile(candidatePath)
  if (hashHex(bytes) !== pending.candidateSnapshotHash) {
    throw new Error("Хэш снимка-кандидата не совпадает")
  }
  return decodeConfigurationIndex(bytes, { expectedComponentPath: pending.componentPath })
}

async function assertBaseSnapshotIdentity(
  projectDir: string,
  pending: PendingPartialXmlSyncStateV1,
): Promise<void> {
  if (pending.baseSnapshotHash === undefined || pending.baseSnapshotGeneration === undefined) return
  const baseAddress = parseComponentPath("cf")
  const bytes = await fs.promises.readFile(configurationIndexPath(projectDir, baseAddress))
  const snapshot = decodeConfigurationIndex(bytes, { expectedComponentPath: "cf" })
  assertSnapshotIdentity({
    name: "базовый снимок",
    actualHash: hashHex(bytes),
    actualGeneration: snapshot.indexGeneration,
    expectedHash: pending.baseSnapshotHash,
    expectedGeneration: pending.baseSnapshotGeneration,
  })
}

function assertSnapshotIdentity(params: {
  readonly name: string
  readonly actualHash: string
  readonly actualGeneration: bigint
  readonly expectedHash: string
  readonly expectedGeneration: string
}): void {
  if (params.actualHash !== params.expectedHash || params.actualGeneration.toString() !== params.expectedGeneration) {
    throw new Error(`Изменён ${params.name} после подготовки частичного пакета`)
  }
}

async function removePublishedPendingFiles(
  projectDir: string,
  pending: PendingPartialXmlSyncStateV1,
): Promise<void> {
  const paths = pendingPartialXmlSyncPaths(projectDir, pending.componentPath)
  await fs.promises.rm(projectPathToAbsolute(projectDir, pending.archiveProjectPath), { force: true })
  await fs.promises.rm(paths.candidatePath, { force: true })
  await fs.promises.rm(paths.pendingPath, { force: true })
}

async function hashArchive(path: string): Promise<bigint> {
  const hasher = xxh3.Xxh3.withSeed()
  for await (const chunk of fs.createReadStream(path)) hasher.update(chunk as Buffer)
  return hasher.digest()
}

function projectPathToAbsolute(projectDir: string, projectPath: string): string {
  return resolve(projectDir, ...projectPath.split("/"))
}

function hashHex(bytes: Uint8Array): string {
  return hashHexFromBigInt(hashFileBytes(bytes))
}

function hashHexFromBigInt(value: bigint): string {
  return value.toString(16).padStart(16, "0")
}
