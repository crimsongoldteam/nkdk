import fs from "node:fs"
import { randomUUID } from "node:crypto"
import { basename, dirname, join, relative, resolve } from "node:path"
import { hashFileBytes } from "@nkdk/runtime"
import {
  configurationIndexStoreDescriptor,
  openConfigurationIndexStore,
  type ConfigurationIndexPendingDelta,
} from "@nkdk/runtime/configuration-index-store"
import { parseComponentPath } from "@nkdk/runtime"

export interface PendingPartialXmlSyncStateV3 {
  readonly version: 3
  readonly packageId: string
  readonly componentPath: string
  readonly archiveProjectPath: string
  readonly archiveHash: string
  readonly candidateAppliedMigrations: readonly string[]
  readonly entries: readonly string[]
  readonly loadTargets: readonly string[]
  readonly delivery: PartialSyncDelivery
}

export type PartialSyncDelivery =
  | { readonly status: "prepared" }
  | {
      readonly status: "transferring" | "applied"
      readonly attemptId: string
      readonly operationLogProjectPath: string
    }

export type PendingPartialXmlSyncStateV2 = PendingPartialXmlSyncStateV3

export interface PendingPartialXmlSyncPaths {
  readonly pendingPath: string
  readonly archiveDir: string
}

export interface PendingPartialXmlSyncStoreDependencies {
  readonly writeAtomic?: (path: string, bytes: Uint8Array) => Promise<void>
}

export function pendingPartialXmlSyncPaths(
  projectDir: string,
  componentPath: string,
): PendingPartialXmlSyncPaths {
  assertSupportedComponentPath(componentPath)
  const root = resolve(projectDir)
  const componentRoot = join(root, ".nkdk", "components", ...componentPath.split("/"), "partial-sync")
  return {
    pendingPath: join(componentRoot, "pending.json"),
    archiveDir: join(root, ".nkdk", "tmp", "incremental-sync", ...componentPath.split("/")),
  }
}

export function partialXmlSyncArchiveProjectPath(componentPath: string, packageId: string): string {
  assertSupportedComponentPath(componentPath)
  assertPackageId(packageId)
  return [".nkdk", "tmp", "incremental-sync", ...componentPath.split("/"), `${packageId}.zip`].join("/")
}

export async function readPendingPartialXmlSync(
  projectDir: string,
  componentPath: string,
): Promise<PendingPartialXmlSyncStateV2 | undefined> {
  const { pendingPath } = pendingPartialXmlSyncPaths(projectDir, componentPath)
  let bytes: Buffer
  try {
    bytes = await fs.promises.readFile(pendingPath)
  } catch (caught) {
    if (hasCode(caught, "ENOENT")) return undefined
    throw caught
  }
  let value: unknown
  try {
    value = JSON.parse(bytes.toString("utf8"))
  } catch (caught) {
    throw new Error(`Повреждён pending.json частичной синхронизации: ${errorMessage(caught)}`)
  }
  return validatePendingState(value, componentPath)
}

export function assertNoPendingPartialXmlSync(projectDir: string, componentPath: string): void {
  const { pendingPath } = pendingPartialXmlSyncPaths(projectDir, componentPath)
  const address = parseComponentPath(componentPath)
  const descriptor = configurationIndexStoreDescriptor(projectDir, address)
  let lmdbPending = false
  if (fs.existsSync(descriptor.dataPath)) {
    const store = openConfigurationIndexStore(descriptor, "readOnly")
    try { lmdbPending = store.hasPending() } finally { void store.close() }
  }
  if (fs.existsSync(pendingPath) || lmdbPending) {
    throw new Error(`Для компонента ${componentPath} существует ожидающий пакет частичной XML-синхронизации`)
  }
}

export async function writePendingPartialXmlSync(
  params: {
    readonly projectDir: string
    readonly state: PendingPartialXmlSyncStateV3
    readonly delta: ConfigurationIndexPendingDelta
  },
  dependencies: PendingPartialXmlSyncStoreDependencies = {},
): Promise<void> {
  if (params.state.version !== 3) throw new Error("Новые pending state должны иметь версию 3")
  const state = validatePendingState(params.state, params.state.componentPath)
  const expectedArchiveProjectPath = partialXmlSyncArchiveProjectPath(state.componentPath, state.packageId)
  if (state.archiveProjectPath !== expectedArchiveProjectPath) {
    throw new Error(`Некорректный путь ZIP ожидающего пакета: ${state.archiveProjectPath}`)
  }
  const archivePath = projectPathToAbsolute(params.projectDir, state.archiveProjectPath)
  const archiveBytes = await fs.promises.readFile(archivePath)
  if (hashHex(archiveBytes) !== state.archiveHash) throw new Error("Хэш ZIP не совпадает с pending state")

  assertNoPendingPartialXmlSync(params.projectDir, state.componentPath)
  const paths = pendingPartialXmlSyncPaths(params.projectDir, state.componentPath)
  const writeAtomic = dependencies.writeAtomic ?? writeFileAtomic
  const descriptor = configurationIndexStoreDescriptor(params.projectDir, parseComponentPath(state.componentPath))
  const store = openConfigurationIndexStore(descriptor, "readWrite")
  try {
    await store.writePending(params.delta)
    await writeAtomic(paths.pendingPath, new TextEncoder().encode(`${JSON.stringify(state, undefined, 2)}\n`))
  } finally {
    await store.close()
  }
}

export async function updatePendingPartialXmlSync(
  params: {
    readonly projectDir: string
    readonly componentPath: string
    readonly update: (state: PendingPartialXmlSyncStateV2) => PendingPartialXmlSyncStateV2
  },
  dependencies: PendingPartialXmlSyncStoreDependencies = {},
): Promise<PendingPartialXmlSyncStateV2> {
  const current = await readPendingPartialXmlSync(params.projectDir, params.componentPath)
  if (current === undefined) throw new Error(`Нет ожидающего пакета для компонента ${params.componentPath}`)
  const next = validatePendingState(params.update(current), params.componentPath)
  const { pendingPath } = pendingPartialXmlSyncPaths(params.projectDir, params.componentPath)
  await (dependencies.writeAtomic ?? writeFileAtomic)(
    pendingPath,
    new TextEncoder().encode(`${JSON.stringify(next, undefined, 2)}\n`)
  )
  return next
}

export async function cleanupPendingPartialXmlSync(
  projectDir: string,
  componentPath: string,
  preserveArchiveProjectPath?: string,
): Promise<void> {
  const paths = pendingPartialXmlSyncPaths(projectDir, componentPath)
  const pending = await readPendingPartialXmlSync(projectDir, componentPath)
  if (pending !== undefined && pending.archiveProjectPath !== preserveArchiveProjectPath) {
    await fs.promises.rm(projectPathToAbsolute(projectDir, pending.archiveProjectPath), { force: true })
  }
  let entries: fs.Dirent[] = []
  try {
    entries = await fs.promises.readdir(paths.archiveDir, { withFileTypes: true })
  } catch (caught) {
    if (!hasCode(caught, "ENOENT")) throw caught
  }
  const preservedName = preserveArchiveProjectPath?.split("/").at(-1)
  await Promise.all(entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".zip") && entry.name !== preservedName)
    .map((entry) => fs.promises.rm(join(paths.archiveDir, entry.name), { force: true })))
  await fs.promises.rm(paths.pendingPath, { force: true })
}

export async function forceClearPendingPartialXmlSync(projectDir: string, componentPath: string): Promise<void> {
  const descriptor = configurationIndexStoreDescriptor(projectDir, parseComponentPath(componentPath))
  if (fs.existsSync(descriptor.dataPath)) {
    const store = openConfigurationIndexStore(descriptor, "readWrite")
    try { await store.clearPending() } finally { await store.close() }
  }
  await cleanupPendingPartialXmlSync(projectDir, componentPath)
}

export async function writeFileAtomic(path: string, bytes: Uint8Array): Promise<void> {
  await fs.promises.mkdir(dirname(path), { recursive: true })
  const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`)
  try {
    await fs.promises.writeFile(temporary, bytes, { flag: "wx" })
    await fs.promises.rename(temporary, path)
  } catch (caught) {
    await fs.promises.rm(temporary, { force: true })
    throw caught
  }
}

function validatePendingState(value: unknown, expectedComponentPath: string): PendingPartialXmlSyncStateV3 {
  if (!isRecord(value) || value.version !== 3) {
    throw new Error("Некорректная версия pending state")
  }
  const requiredStrings = [
    "packageId", "componentPath", "archiveProjectPath", "archiveHash",
  ] as const
  for (const key of requiredStrings) {
    if (typeof value[key] !== "string") throw new Error(`Некорректное поле pending state: ${key}`)
  }
  assertPackageId(value.packageId as string)
  assertSupportedComponentPath(value.componentPath as string)
  if (value.componentPath !== expectedComponentPath) throw new Error("Pending state относится к другому компоненту")
  for (const key of ["archiveHash"] as const) {
    assertHash(value[key] as string, key)
  }
  if (!Array.isArray(value.candidateAppliedMigrations)
    || value.candidateAppliedMigrations.some((name) => typeof name !== "string")) {
    throw new Error("Некорректный список migration в pending state")
  }
  const migrations = value.candidateAppliedMigrations as string[]
  if (new Set(migrations).size !== migrations.length) throw new Error("Повтор migration в pending state")
  const entries = validateStringList(value.entries, "entries")
  const loadTargets = validateStringList(value.loadTargets, "loadTargets")
  const delivery = validateDelivery(value.delivery)
  const state = { ...value, version: 3, entries, loadTargets, delivery } as unknown as PendingPartialXmlSyncStateV3
  if (state.archiveProjectPath !== partialXmlSyncArchiveProjectPath(state.componentPath, state.packageId)) {
    throw new Error("Некорректный путь ZIP в pending state")
  }
  return state
}

function validateStringList(value: unknown, name: string): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.length === 0)) {
    throw new Error(`Некорректное поле pending state: ${name}`)
  }
  return value as string[]
}

function validateDelivery(value: unknown): PartialSyncDelivery {
  if (!isRecord(value) || typeof value.status !== "string") {
    throw new Error("Некорректная фаза доставки в pending state")
  }
  if (value.status === "prepared") {
    if (Object.keys(value).length !== 1) throw new Error("Некорректная фаза доставки в pending state")
    return { status: "prepared" }
  }
  if (value.status !== "transferring" && value.status !== "applied") {
    throw new Error("Некорректная фаза доставки в pending state")
  }
  if (typeof value.attemptId !== "string" || typeof value.operationLogProjectPath !== "string") {
    throw new Error("Некорректная фаза доставки в pending state")
  }
  assertPackageId(value.attemptId)
  const expectedLogPath = [
    ".nkdk", "tmp", "sync-to-infobase", value.attemptId, "platform.log",
  ].join("/")
  if (value.operationLogProjectPath !== expectedLogPath) {
    throw new Error("Некорректный путь журнала передачи в pending state")
  }
  return {
    status: value.status,
    attemptId: value.attemptId,
    operationLogProjectPath: value.operationLogProjectPath,
  }
}

function projectPathToAbsolute(projectDir: string, projectPath: string): string {
  const root = resolve(projectDir)
  const absolute = resolve(root, ...projectPath.split("/"))
  if (relative(root, absolute).startsWith("..")) throw new Error(`Путь выходит за проект: ${projectPath}`)
  return absolute
}

function assertSupportedComponentPath(value: string): void {
  parseComponentPath(value)
}

function assertPackageId(value: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) || value === "." || value === "..") {
    throw new Error(`Некорректный идентификатор пакета: ${value}`)
  }
}

function assertHash(value: string, name: string): void {
  if (!/^[0-9a-f]{16}$/.test(value)) throw new Error(`Некорректный хэш ${name}`)
}

function hashHex(bytes: Uint8Array): string {
  return hashFileBytes(bytes).toString(16).padStart(16, "0")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function hasCode(caught: unknown, code: string): boolean {
  return isRecord(caught) && caught.code === code
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}
