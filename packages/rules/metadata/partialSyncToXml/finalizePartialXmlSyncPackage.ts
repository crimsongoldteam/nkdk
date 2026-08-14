import fs from "node:fs"
import { resolve } from "node:path"
import { xxh3 } from "@node-rs/xxhash"
import {
  parseComponentPath,
} from "@nkdk/runtime"
import {
  configurationIndexStoreDescriptor,
  openConfigurationIndexStore,
  type ConfigurationIndexStore,
} from "@nkdk/runtime/configuration-index-store"
import { pendingPartialXmlSyncPaths, readPendingPartialXmlSync, type PendingPartialXmlSyncStateV3 } from "./pendingStore"
import { publishPartialXmlSyncAppliedMigrations } from "./migrationState"

export interface FinalizePartialXmlSyncDependencies {
  readonly openStore?: (projectDir: string, componentPath: string) => ConfigurationIndexStore
  readonly publishMigrations?: (params: {
    readonly projectDir: string
    readonly componentPath: string
    readonly applied: readonly string[]
  }) => Promise<void>
  readonly hashArchive?: (path: string) => Promise<bigint>
}

export async function finalizePartialXmlSyncPackage(
  params: { readonly projectDir: string; readonly componentPath: string; readonly packageId: string },
  dependencies: FinalizePartialXmlSyncDependencies = {},
): Promise<{ readonly status: "published" | "alreadyPublished"; readonly configurationIndexPath: string }> {
  const projectDir = resolve(params.projectDir)
  const pending = await readPendingPartialXmlSync(projectDir, params.componentPath)
  if (pending === undefined) throw new Error(`Нет ожидающего пакета для компонента ${params.componentPath}`)
  if (pending.packageId !== params.packageId) throw new Error(`Не совпадает идентификатор ожидающего пакета: ${params.packageId}`)
  if (pending.delivery.status !== "applied") throw new Error("Ожидающий пакет не имеет подтверждённой успешной передачи")

  const archivePath = projectPathToAbsolute(projectDir, pending.archiveProjectPath)
  const archiveHash = await (dependencies.hashArchive ?? hashArchive)(archivePath)
  if (hashHex(archiveHash) !== pending.archiveHash) throw new Error("Хэш архива ожидающего пакета не совпадает")

  const descriptor = configurationIndexStoreDescriptor(projectDir, parseComponentPath(params.componentPath))
  const store = (dependencies.openStore ?? defaultOpenStore)(projectDir, params.componentPath)
  try {
    const alreadyPublished = store.pendingAlreadyApplied()
    if (!alreadyPublished) await store.applyPending()
    await (dependencies.publishMigrations ?? publishPartialXmlSyncAppliedMigrations)({
      projectDir,
      componentPath: params.componentPath,
      applied: pending.candidateAppliedMigrations,
    })
    await store.clearPending()
    await removePublishedPendingFiles(projectDir, pending)
    return {
      status: alreadyPublished ? "alreadyPublished" : "published",
      configurationIndexPath: descriptor.dataPath,
    }
  } finally {
    await store.close()
  }
}

function defaultOpenStore(projectDir: string, componentPath: string): ConfigurationIndexStore {
  return openConfigurationIndexStore(
    configurationIndexStoreDescriptor(projectDir, parseComponentPath(componentPath)),
    "readWrite",
  )
}

async function removePublishedPendingFiles(projectDir: string, pending: PendingPartialXmlSyncStateV3): Promise<void> {
  const paths = pendingPartialXmlSyncPaths(projectDir, pending.componentPath)
  await fs.promises.rm(projectPathToAbsolute(projectDir, pending.archiveProjectPath), { force: true })
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

function hashHex(value: bigint): string {
  return value.toString(16).padStart(16, "0")
}
