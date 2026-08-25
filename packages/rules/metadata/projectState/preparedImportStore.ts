import { mkdir, mkdtemp, rm } from "node:fs/promises"
import { join, resolve } from "node:path"
import { open, type RootDatabase } from "lmdb"

export interface PreparedImportRecordLocator {
  readonly assignmentId: string
  readonly weight: number
}

export interface PreparedImportStoreDescriptor {
  readonly directory: string
  readonly dataPath: string
  readonly lockPath: string
}

export interface PreparedImportStore {
  descriptor(): PreparedImportStoreDescriptor
  put(locator: PreparedImportRecordLocator, bytes: Uint8Array): Promise<void>
  read(assignmentId: string): Promise<Uint8Array>
  release(assignmentId: string): Promise<void>
  close(): Promise<void>
}

export class PreparedImportStoreError extends Error {
  constructor(readonly code: "xml_import_prepared_missing", message: string) {
    super(message)
    this.name = "PreparedImportStoreError"
  }
}

export async function createPreparedImportStore(projectDir: string): Promise<PreparedImportStore> {
  const parent = join(resolve(projectDir), ".nkdk", "tmp")
  await mkdir(parent, { recursive: true })
  const directory = await mkdtemp(join(parent, "prepared-import-"))
  return openStore(descriptorForDirectory(directory), "readWrite", true)
}

export function openPreparedImportStore(
  descriptor: PreparedImportStoreDescriptor,
  mode: "readOnly" | "readWrite",
): PreparedImportStore {
  return openStore(validateDescriptor(descriptor), mode, false)
}

function openStore(
  descriptor: PreparedImportStoreDescriptor,
  mode: "readOnly" | "readWrite",
  ownsFiles: boolean,
): PreparedImportStore {
  const database = open<Uint8Array, string>({
    path: descriptor.dataPath,
    noSubdir: true,
    encoding: "binary",
    readOnly: mode === "readOnly",
    overlappingSync: process.platform !== "win32",
  })
  let closePromise: Promise<void> | undefined
  return {
    descriptor: () => descriptor,
    async put(locator, bytes) {
      assertWritable(mode)
      const assignmentId = validateAssignmentId(locator.assignmentId)
      if (!Number.isFinite(locator.weight) || locator.weight < 0) {
        throw new Error(`Некорректный вес подготовленного задания ${assignmentId}`)
      }
      await database.put(assignmentId, bytes.slice())
    },
    async read(assignmentId) {
      const value = database.get(validateAssignmentId(assignmentId))
      if (value === undefined) {
        throw new PreparedImportStoreError(
          "xml_import_prepared_missing",
          `Не найдена подготовленная запись XML-import: ${assignmentId}`,
        )
      }
      return Uint8Array.from(value)
    },
    async release(assignmentId) {
      assertWritable(mode)
      await database.remove(validateAssignmentId(assignmentId))
    },
    close() {
      if (closePromise !== undefined) return closePromise
      closePromise = closeStore(database, descriptor, ownsFiles)
      return closePromise
    },
  }
}

async function closeStore(
  database: RootDatabase<Uint8Array, string>,
  descriptor: PreparedImportStoreDescriptor,
  ownsFiles: boolean,
): Promise<void> {
  await database.close()
  if (ownsFiles) await rm(descriptor.directory, { recursive: true, force: true })
}

function descriptorForDirectory(directory: string): PreparedImportStoreDescriptor {
  const canonical = resolve(directory)
  const dataPath = join(canonical, "records.lmdb")
  return { directory: canonical, dataPath, lockPath: `${dataPath}-lock` }
}

function validateDescriptor(descriptor: PreparedImportStoreDescriptor): PreparedImportStoreDescriptor {
  const expected = descriptorForDirectory(descriptor.directory)
  if (resolve(descriptor.dataPath) !== expected.dataPath || resolve(descriptor.lockPath) !== expected.lockPath) {
    throw new Error("Некорректный путь хранилища подготовленного XML-import")
  }
  return expected
}

function validateAssignmentId(value: string): string {
  if (value.length === 0 || value.includes("\0")) throw new Error("Некорректный идентификатор подготовленного задания")
  return value
}

function assertWritable(mode: "readOnly" | "readWrite"): void {
  if (mode !== "readWrite") throw new Error("Хранилище подготовленного XML-import открыто только для чтения")
}
