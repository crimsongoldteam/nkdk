import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import type { ConfigurationImportResult } from "@nkdk/runtime"
import type { ImportedMetadataProject } from "./metadata-project"
import { replaceDirectoryWithRollback, updateNkdkFixture } from "./nkdk-fixture"

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe("updateNkdkFixture", () => {
  it("не заменяет эталон после ошибки импорта", async () => {
    const root = await temporaryRoot()
    const targetDir = join(root, "fixtures", "nkdk")
    const importedRoot = join(root, "imported")
    const projectDir = join(importedRoot, "project")
    await write(join(targetDir, "old.txt"), "old")
    await write(join(projectDir, "new.txt"), "new")

    await expect(updateNkdkFixture({
      targetDir,
      dependencies: {
        importProject: async () => importedProject({
          root: importedRoot,
          projectDir,
          result: {
            componentPath: "cf",
            succeeded: 0,
            failed: [{
              severity: "error",
              code: "fixture",
              message: "Ошибка импорта",
              targetProjectPath: "cf/Конфигурация.yaml",
            }],
            warnings: [],
          },
        }),
        removeProject: async () => rm(importedRoot, { recursive: true, force: true }),
      },
    })).rejects.toThrow("Ошибка импорта")

    await expect(readFile(join(targetDir, "old.txt"), "utf8")).resolves.toBe("old")
    await expect(readFile(join(targetDir, "new.txt"), "utf8")).rejects.toMatchObject({ code: "ENOENT" })
    await expect(readFile(join(importedRoot, "project", "new.txt"), "utf8"))
      .rejects.toMatchObject({ code: "ENOENT" })
  })

  it("заменяет YAML-эталон после успешного импорта без сгенерированного состояния", async () => {
    const root = await temporaryRoot()
    const targetDir = join(root, "fixtures", "nkdk")
    const importedRoot = join(root, "imported")
    const projectDir = join(importedRoot, "project")
    await write(join(targetDir, "old.txt"), "old")
    await write(join(projectDir, "cf", "Конфигурация.yaml"), "Имя: Новая\n")
    await write(join(projectDir, ".nkdk", "cache", "project-state.bin"), "cache")
    await write(join(projectDir, ".nkdk", "components", "cf", "configuration-index.lmdb", "data.mdb"), "index")

    await updateNkdkFixture({
      targetDir,
      dependencies: {
        importProject: async () => importedProject({
          root: importedRoot,
          projectDir,
          result: { componentPath: "cf", succeeded: 1, failed: [], warnings: [] },
        }),
        removeProject: async () => rm(importedRoot, { recursive: true, force: true }),
      },
    })

    await expect(readFile(join(targetDir, "cf", "Конфигурация.yaml"), "utf8"))
      .resolves.toBe("Имя: Новая\n")
    await expect(readFile(join(targetDir, "old.txt"), "utf8"))
      .rejects.toMatchObject({ code: "ENOENT" })
    await expect(readFile(join(targetDir, ".nkdk", "components", "cf", "configuration-index.lmdb", "data.mdb"), "utf8"))
      .rejects.toMatchObject({ code: "ENOENT" })
  })
})

describe("replaceDirectoryWithRollback", () => {
  it("восстанавливает прежний эталон при ошибке установки нового", async () => {
    const root = await temporaryRoot()
    const sourceDir = join(root, "source")
    const targetDir = join(root, "fixtures", "nkdk")
    await write(join(sourceDir, "new.txt"), "new")
    await write(join(targetDir, "old.txt"), "old")
    let renameCalls = 0
    const renamePath: typeof rename = async (from, to) => {
      renameCalls += 1
      if (renameCalls === 2) throw new Error("Ошибка установки")
      await rename(from, to)
    }

    await expect(replaceDirectoryWithRollback({ sourceDir, targetDir, renamePath }))
      .rejects.toThrow("Ошибка установки")

    await expect(readFile(join(targetDir, "old.txt"), "utf8")).resolves.toBe("old")
  })
})

function importedProject(params: {
  readonly root: string
  readonly projectDir: string
  readonly result: ConfigurationImportResult
}): ImportedMetadataProject {
  return {
    root: params.root,
    projectDir: params.projectDir,
    durationsMs: {},
    results: [params.result],
  }
}

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "nkdk-fixture-test-"))
  roots.push(root)
  return root
}

async function write(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
}
