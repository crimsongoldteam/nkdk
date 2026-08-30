import { Value } from "typebox/value"
import {
  backgroundOperationSnapshotSchema,
  type BackgroundOperationSnapshot,
} from "../contracts/backgroundOperations"

const RETENTION_MS = 30 * 24 * 60 * 60 * 1_000
const SAFE_OPERATION_ID = /^[A-Za-z0-9_-]+$/u
const SECRET_KEY = /password|token|secret/iu

export interface BackgroundOperationStoreFileSystem {
  mkdir(path: string): Promise<void>
  writeFile(path: string, content: string): Promise<void>
  rename(source: string, target: string): Promise<void>
  readFile(path: string): Promise<string | undefined>
  list(directory: string): Promise<readonly string[]>
  remove(path: string): Promise<void>
}

export interface BackgroundOperationStore {
  write(snapshot: BackgroundOperationSnapshot): Promise<void>
  read(projectDir: string, operationId: string): Promise<BackgroundOperationSnapshot | undefined>
  recover(projectDir: string): Promise<void>
  cleanup(projectDir: string): Promise<void>
}

export function createBackgroundOperationStore(options: {
  readonly fileSystem: BackgroundOperationStoreFileSystem
  readonly temporaryId: () => string
  readonly now: () => Date
}): BackgroundOperationStore {
  const { fileSystem, temporaryId, now } = options

  return { write, read, recover, cleanup }

  async function write(snapshot: BackgroundOperationSnapshot): Promise<void> {
    assertNoSecrets(snapshot)
    const directory = operationDirectory(snapshot.projectDir)
    const target = operationPath(snapshot.projectDir, snapshot.operationId)
    const temporary = `${directory}/${snapshot.operationId}.${temporaryId()}.tmp`
    await fileSystem.mkdir(directory)
    await fileSystem.writeFile(temporary, `${JSON.stringify(snapshot)}\n`)
    await fileSystem.rename(temporary, target)
  }

  async function read(projectDir: string, operationId: string): Promise<BackgroundOperationSnapshot | undefined> {
    const content = await fileSystem.readFile(operationPath(projectDir, operationId))
    if (content === undefined) return undefined
    const parsed: unknown = JSON.parse(content)
    if (!Value.Check(backgroundOperationSnapshotSchema, parsed)) {
      throw new Error(`Некорректная запись фоновой операции ${operationId}`)
    }
    return parsed
  }

  async function recover(projectDir: string): Promise<void> {
    for (const operationId of await operationIds(projectDir)) {
      const snapshot = await read(projectDir, operationId)
      if (snapshot?.status !== "queued" && snapshot?.status !== "running") continue
      await write({
        ...snapshot,
        status: "interrupted",
        updatedAt: now().toISOString(),
      })
    }
  }

  async function cleanup(projectDir: string): Promise<void> {
    const cutoff = now().getTime() - RETENTION_MS
    for (const operationId of await operationIds(projectDir)) {
      const snapshot = await read(projectDir, operationId)
      if (snapshot === undefined || snapshot.status === "queued" || snapshot.status === "running") continue
      if (Date.parse(snapshot.updatedAt) >= cutoff) continue
      await fileSystem.remove(operationPath(projectDir, operationId))
    }
  }

  async function operationIds(projectDir: string): Promise<string[]> {
    const names = await fileSystem.list(operationDirectory(projectDir))
    return names
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.slice(0, -".json".length))
      .filter((operationId) => SAFE_OPERATION_ID.test(operationId))
  }
}

function operationDirectory(projectDir: string): string {
  return `${projectDir.replace(/[\\/]+$/u, "")}/.nkdk/operations`
}

function operationPath(projectDir: string, operationId: string): string {
  if (!SAFE_OPERATION_ID.test(operationId)) throw new Error(`Некорректный operationId: ${operationId}`)
  return `${operationDirectory(projectDir)}/${operationId}.json`
}

function assertNoSecrets(value: unknown): void {
  if (typeof value !== "object" || value === null) return
  if (Array.isArray(value)) {
    for (const item of value) assertNoSecrets(item)
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (SECRET_KEY.test(key)) throw new Error(`Нельзя сохранять секретное поле ${key}`)
    assertNoSecrets(child)
  }
}
