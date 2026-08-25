import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { createProjectStateService } from "./service"
import { openPreparedImportStore } from "./preparedImportStore"

describe("prepared import store", () => {
  const cleanupDirectories = new Set<string>()

  afterEach(async () => {
    for (const directory of cleanupDirectories) {
      await fs.promises.rm(directory, { recursive: true, force: true })
    }
    cleanupDirectories.clear()
  })

  it("читает записи из независимого handle и удаляет хранилище после finalize", async () => {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-prepared-import-"))
    cleanupDirectories.add(projectDir)
    const state = createProjectStateService()
    const session = await state.beginImport({ projectDir, workerCount: 2, output: { componentPaths: ["cf"] } })
    const store = await session.preparedImportStore()
    await store.put({ assignmentId: "one", weight: 10 }, Uint8Array.of(1, 2, 3))
    await store.put({ assignmentId: "two", weight: 20 }, Uint8Array.of(4, 5))
    const reader = openPreparedImportStore(store.descriptor(), "readOnly")

    expect(await reader.read("one")).toEqual(Uint8Array.of(1, 2, 3))
    expect(await reader.read("two")).toEqual(Uint8Array.of(4, 5))
    await store.release("one")
    await expect(reader.read("one")).rejects.toMatchObject({ code: "xml_import_prepared_missing" })
    await reader.close()

    const directory = store.descriptor().directory
    await session.commitWorkingIndex()
    await session.commitSemanticIndex()
    await session.finalize()
    expect(fs.existsSync(directory)).toBe(false)
    await state.close()
  })

  it("удаляет хранилище после abort и разрешает следующий import", async () => {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-prepared-import-abort-"))
    cleanupDirectories.add(projectDir)
    const state = createProjectStateService()
    const first = await state.beginImport({ projectDir, workerCount: 1, output: { componentPaths: ["cf"] } })
    const store = await first.preparedImportStore()
    await store.put({ assignmentId: "one", weight: 1 }, Uint8Array.of(1))
    const directory = store.descriptor().directory

    await first.abort(new Error("boom"))
    expect(fs.existsSync(directory)).toBe(false)

    const second = await state.beginImport({ projectDir, workerCount: 1, output: { componentPaths: ["cf"] } })
    await second.abort(new Error("done"))
    await state.close()
  })
})
