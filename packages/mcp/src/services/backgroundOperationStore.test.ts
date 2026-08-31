import { describe, expect, it } from "vitest"
import type { BackgroundOperationSnapshot } from "../contracts/backgroundOperations"
import { createBackgroundOperationStore, type BackgroundOperationStoreFileSystem } from "./backgroundOperationStore"

const running: BackgroundOperationSnapshot = {
  ok: true,
  status: "running",
  operationId: "operation-1",
  operationKind: "validate_project",
  projectDir: "C:/project",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:01.000Z",
  stage: "validation",
  messages: [],
}

describe("background operation store", () => {
  it("writes a snapshot through a temporary file and atomic rename", async () => {
    const memory = memoryFileSystem()
    const store = testStore(memory.fileSystem)

    await store.write(running)

    expect(memory.calls).toEqual([
      ["mkdir", "C:/project/.nkdk/operations"],
      ["writeFile", "C:/project/.nkdk/operations/operation-1.temporary.tmp"],
      ["rename", "C:/project/.nkdk/operations/operation-1.temporary.tmp", "C:/project/.nkdk/operations/operation-1.json"],
    ])
    await expect(store.read("C:/project", "operation-1")).resolves.toEqual(running)
  })

  it("marks active records interrupted without rerunning them", async () => {
    const memory = memoryFileSystem()
    const store = testStore(memory.fileSystem)
    await store.write(running)

    await store.recover("C:/project")

    await expect(store.read("C:/project", "operation-1")).resolves.toMatchObject({
      status: "interrupted",
      updatedAt: "2026-08-30T00:00:00.000Z",
    })
  })

  it("removes only terminal records older than thirty days", async () => {
    const memory = memoryFileSystem()
    const store = testStore(memory.fileSystem)
    await store.write({ ...running, operationId: "active" })
    await store.write({ ...running, operationId: "old", status: "cancelled", updatedAt: "2026-07-01T00:00:00.000Z" })
    await store.write({ ...running, operationId: "recent", status: "cancelled", updatedAt: "2026-08-20T00:00:00.000Z" })

    await store.cleanup("C:/project")

    await expect(store.read("C:/project", "old")).resolves.toBeUndefined()
    await expect(store.read("C:/project", "active")).resolves.toBeDefined()
    await expect(store.read("C:/project", "recent")).resolves.toBeDefined()
  })

  it("rejects secret-looking persisted fields", async () => {
    const store = createBackgroundOperationStore({
      fileSystem: memoryFileSystem().fileSystem,
      temporaryId: () => "temporary",
      now: () => new Date("2026-08-30T00:00:00.000Z"),
    })

    await expect(store.write({ ...running, password: "secret" } as never))
      .rejects.toThrow("секретное поле password")
  })
})

function testStore(fileSystem: BackgroundOperationStoreFileSystem) {
  return createBackgroundOperationStore({
    fileSystem,
    temporaryId: () => "temporary",
    now: () => new Date("2026-08-30T00:00:00.000Z"),
  })
}

function memoryFileSystem() {
  const files = new Map<string, string>()
  const calls: string[][] = []
  const fileSystem: BackgroundOperationStoreFileSystem = {
    async mkdir(path) { calls.push(["mkdir", path]) },
    async writeFile(path, content) {
      calls.push(["writeFile", path])
      if (files.has(path)) throw new Error("exists")
      files.set(path, content)
    },
    async rename(source, target) {
      calls.push(["rename", source, target])
      const content = files.get(source)
      if (content === undefined) throw new Error("missing")
      files.delete(source)
      files.set(target, content)
    },
    async readFile(path) {
      const content = files.get(path)
      if (content === undefined) return undefined
      return content
    },
    async list(directory) {
      return [...files.keys()]
        .filter((path) => path.startsWith(`${directory}/`) && path.endsWith(".json"))
        .map((path) => path.slice(directory.length + 1))
    },
    async remove(path) { files.delete(path) },
  }
  return { calls, fileSystem }
}
