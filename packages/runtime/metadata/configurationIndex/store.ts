import { existsSync, mkdirSync } from "node:fs"
import { dirname, posix } from "node:path"
import { open, type Database, type RootDatabase } from "lmdb"
import { decodeConfigurationIndexBlock, decodeContentHash } from "./blockCodec"
import type { ConfigurationIndexBlock } from "./types"
export {
  CONFIGURATION_INDEX_SCHEMA_VERSION,
  configurationIndexStoreDescriptor,
} from "./storePath"
import {
  CONFIGURATION_INDEX_SCHEMA_VERSION,
  type ConfigurationIndexStoreDescriptor,
} from "./storePath"

export type { ConfigurationIndexStoreDescriptor } from "./storePath"

export interface ConfigurationIndexStore {
  descriptor(): ConfigurationIndexStoreDescriptor
  readHashes(): readonly { projectPath: string; contentHash: bigint }[]
  getBlocks(projectPaths: readonly string[]): ReadonlyMap<string, ConfigurationIndexBlock>
  hasBlock(projectPath: string): boolean
  hasPending(): boolean
  flush(): Promise<void>
  close(): Promise<void>
}

interface ConfigurationIndexTables {
  readonly meta: Database<Uint8Array, string>
  readonly hashes: Database<Uint8Array, string>
  readonly blocks: Database<Uint8Array, string>
  readonly pendingHashes: Database<Uint8Array, string>
  readonly pendingBlocks: Database<Uint8Array, string>
}

export function openConfigurationIndexStore(
  descriptor: ConfigurationIndexStoreDescriptor,
  mode: "readOnly" | "readWrite",
): ConfigurationIndexStore {
  let root: RootDatabase<Uint8Array, string> | undefined
  try {
    validateDescriptor(descriptor)
    if (mode === "readOnly" && !existsSync(descriptor.dataPath)) throw new Error("Файл не существует")
    if (mode === "readWrite") mkdirSync(dirname(descriptor.dataPath), { recursive: true })
    root = open<Uint8Array, string>({
      path: descriptor.dataPath,
      noSubdir: true,
      encoding: "binary",
      maxDbs: 8,
      readOnly: mode === "readOnly",
      overlappingSync: process.platform !== "win32",
    })
    const tables = openTables(root)
    initializeOrValidateSchema(root, tables.meta, mode)
    return new LmdbConfigurationIndexStore(descriptor, root, tables)
  } catch (error) {
    if (root !== undefined) void root.close()
    throw new Error(`Не удалось открыть снимок ${descriptor.dataPath}: ${errorMessage(error)}`, { cause: error })
  }
}

class LmdbConfigurationIndexStore implements ConfigurationIndexStore {
  private closePromise: Promise<void> | undefined

  constructor(
    private readonly storeDescriptor: ConfigurationIndexStoreDescriptor,
    private readonly root: RootDatabase<Uint8Array, string>,
    private readonly tables: ConfigurationIndexTables,
  ) {}

  descriptor(): ConfigurationIndexStoreDescriptor {
    return this.storeDescriptor
  }

  readHashes(): readonly { projectPath: string; contentHash: bigint }[] {
    const result = [...this.tables.hashes.getRange()].map(({ key, value }) => ({
      projectPath: validateProjectPath(key),
      contentHash: decodeContentHash(value),
    }))
    return result.sort((left, right) => compareUtf8(left.projectPath, right.projectPath))
  }

  getBlocks(projectPaths: readonly string[]): ReadonlyMap<string, ConfigurationIndexBlock> {
    const requested = [...new Set(projectPaths.map(validateProjectPath))].sort(compareUtf8)
    const result = new Map<string, ConfigurationIndexBlock>()
    for (const projectPath of requested) {
      const value = this.tables.blocks.get(projectPath)
      if (value !== undefined) result.set(projectPath, decodeConfigurationIndexBlock(value))
    }
    return result
  }

  hasBlock(projectPath: string): boolean {
    return this.tables.blocks.doesExist(validateProjectPath(projectPath))
  }

  hasPending(): boolean {
    return this.tables.pendingHashes.getCount() !== 0 || this.tables.pendingBlocks.getCount() !== 0
  }

  async flush(): Promise<void> {
    await this.root.flushed
  }

  close(): Promise<void> {
    this.closePromise ??= this.root.close()
    return this.closePromise
  }
}

function openTables(root: RootDatabase<Uint8Array, string>): ConfigurationIndexTables {
  return {
    meta: root.openDB<Uint8Array, string>({ name: "meta", encoding: "binary" }),
    hashes: root.openDB<Uint8Array, string>({ name: "hashes", encoding: "binary" }),
    blocks: root.openDB<Uint8Array, string>({ name: "blocks", encoding: "binary" }),
    pendingHashes: root.openDB<Uint8Array, string>({ name: "pendingHashes", encoding: "binary" }),
    pendingBlocks: root.openDB<Uint8Array, string>({ name: "pendingBlocks", encoding: "binary" }),
  }
}

function initializeOrValidateSchema(
  root: RootDatabase<Uint8Array, string>,
  meta: Database<Uint8Array, string>,
  mode: "readOnly" | "readWrite",
): void {
  const encodedVersion = meta.get("schemaVersion")
  if (encodedVersion === undefined) {
    if (mode === "readOnly") throw new Error("В снимке отсутствует schemaVersion")
    const value = Buffer.alloc(4)
    value.writeUInt32LE(CONFIGURATION_INDEX_SCHEMA_VERSION)
    root.transactionSync(() => meta.putSync("schemaVersion", value))
    return
  }
  if (encodedVersion.byteLength !== 4) throw new Error("Некорректный schemaVersion")
  const actualVersion = Buffer.from(encodedVersion).readUInt32LE()
  if (actualVersion !== CONFIGURATION_INDEX_SCHEMA_VERSION) {
    throw new Error(`Неподдерживаемый schemaVersion: ${actualVersion}`)
  }
}

function validateDescriptor(descriptor: ConfigurationIndexStoreDescriptor): void {
  if (descriptor.schemaVersion !== CONFIGURATION_INDEX_SCHEMA_VERSION) {
    throw new Error(`Неподдерживаемая версия descriptor: ${descriptor.schemaVersion}`)
  }
  if (descriptor.lockPath !== `${descriptor.dataPath}-lock`) throw new Error("Некорректный путь lock-файла")
}

export function validateConfigurationIndexProjectPath(projectPath: string): string {
  return validateProjectPath(projectPath)
}

function validateProjectPath(projectPath: string): string {
  if (projectPath.length === 0 || projectPath.includes("\0") || projectPath.includes("\\")) {
    throw new Error(`Недопустимый project path: ${projectPath}`)
  }
  if (posix.isAbsolute(projectPath) || posix.normalize(projectPath) !== projectPath) {
    throw new Error(`Недопустимый project path: ${projectPath}`)
  }
  const encoded = Buffer.from(projectPath, "utf8")
  if (new TextDecoder("utf-8", { fatal: true }).decode(encoded) !== projectPath) {
    throw new Error(`Недопустимый UTF-8 project path: ${projectPath}`)
  }
  return projectPath
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
