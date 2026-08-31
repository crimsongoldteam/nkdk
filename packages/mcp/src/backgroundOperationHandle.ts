import { randomUUID } from "node:crypto"
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises"
import { createBackgroundOperationManager, type BackgroundOperationManager } from "./services/backgroundOperationManager"
import { createBackgroundOperationRegistry } from "./services/backgroundOperationRegistry"
import {
  createBackgroundOperationStore,
  type BackgroundOperationStoreFileSystem,
} from "./services/backgroundOperationStore"

export interface BackgroundOperationHandle {
  get(): Promise<BackgroundOperationManager>
  close(): Promise<void>
}

export function createBackgroundOperationHandle(
  create: () => BackgroundOperationManager,
): BackgroundOperationHandle {
  let managerPromise: Promise<BackgroundOperationManager> | undefined
  let closePromise: Promise<void> | undefined
  let closed = false
  return {
    get() {
      if (closed) return Promise.reject(new Error("Background operation handle закрыт"))
      managerPromise ??= Promise.resolve(create())
      return managerPromise
    },
    close() {
      if (closePromise !== undefined) return closePromise
      closed = true
      closePromise = managerPromise?.then((manager) => manager.close()) ?? Promise.resolve()
      return closePromise
    },
  }
}

const nodeFileSystem: BackgroundOperationStoreFileSystem = {
  async mkdir(path) { await mkdir(path, { recursive: true }) },
  async writeFile(path, content) { await writeFile(path, content, { flag: "wx" }) },
  async rename(source, target) { await rename(source, target) },
  async readFile(path) {
    return readFile(path, "utf8").catch((caught: NodeJS.ErrnoException) => {
      if (caught.code === "ENOENT") return undefined
      throw caught
    })
  },
  async list(directory) {
    return readdir(directory).catch((caught: NodeJS.ErrnoException) => {
      if (caught.code === "ENOENT") return []
      throw caught
    })
  },
  async remove(path) { await rm(path, { force: true }) },
}

export const backgroundOperationHandle = createBackgroundOperationHandle(() => createBackgroundOperationManager({
  runners: createBackgroundOperationRegistry(),
  store: createBackgroundOperationStore({
    fileSystem: nodeFileSystem,
    temporaryId: randomUUID,
    now: () => new Date(),
  }),
  operationId: randomUUID,
  now: () => new Date(),
}))
