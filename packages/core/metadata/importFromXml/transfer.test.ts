import fs from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, join, relative } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import type { ImportResultFile } from "./types"
import { mergeImportResultFiles, transferImportResult } from "./transfer"

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe("XML import result transfer", () => {
  it("rejects duplicate and escaping target paths before transfer", async () => {
    expect(() => mergeImportResultFiles([workerFile("Конфигурация.yaml"), externalFile("Конфигурация.yaml")])).toThrow(
      "Повторный целевой путь"
    )
    expect(() => mergeImportResultFiles([workerFile("../outside.yaml")])).toThrow("вне Проекта")

    const calls: string[] = []
    await expect(
      transferImportResult(
        { projectDir: "/project", files: [workerFile("../outside.yaml")], concurrency: 1 },
        recordingFileOperations(calls)
      )
    ).rejects.toThrow("вне Проекта")
    expect(calls).toEqual([])
  })

  it("moves worker files and copies XML external files", async () => {
    const root = await createTempDir("move-copy")
    const projectDir = join(root, "project")
    const workerYaml = join(root, "worker", "Конфигурация.yaml")
    const xmlModule = join(root, "xml", "МодульПриложения.bsl")
    const yamlText = "name: Конфигурация\n"
    const moduleText = 'Сообщить("Импорт");\n'
    await fs.promises.mkdir(join(root, "worker"), { recursive: true })
    await fs.promises.mkdir(join(root, "xml"), { recursive: true })
    await fs.promises.mkdir(projectDir, { recursive: true })
    await fs.promises.writeFile(workerYaml, yamlText)
    await fs.promises.writeFile(xmlModule, moduleText)
    await fs.promises.writeFile(join(projectDir, "Конфигурация.yaml"), "old yaml")
    await fs.promises.writeFile(join(projectDir, "МодульПриложения.bsl"), "old module")
    const files = [
      { sourceKind: "worker", sourcePath: workerYaml, targetProjectPath: "Конфигурация.yaml" },
      { sourceKind: "xml", sourcePath: xmlModule, targetProjectPath: "МодульПриложения.bsl" },
    ] as const

    await transferImportResult({ projectDir, files, concurrency: 2 })

    await expect(fs.promises.stat(workerYaml)).rejects.toMatchObject({ code: "ENOENT" })
    expect(await fs.promises.readFile(join(projectDir, "Конфигурация.yaml"), "utf8")).toBe(yamlText)
    expect(await fs.promises.readFile(xmlModule, "utf8")).toBe(moduleText)
    expect(await fs.promises.readFile(join(projectDir, "МодульПриложения.bsl"), "utf8")).toBe(moduleText)
  })

  it("rejects an existing symlink directory that resolves outside the Project before transfer", async () => {
    const root = await createTempDir("symlink")
    const projectDir = join(root, "project")
    const outsideDir = join(root, "outside")
    const workerYaml = join(root, "worker", "escaped.yaml")
    await fs.promises.mkdir(join(root, "worker"), { recursive: true })
    await fs.promises.mkdir(projectDir, { recursive: true })
    await fs.promises.mkdir(outsideDir, { recursive: true })
    await fs.promises.writeFile(workerYaml, "new escaped")
    await fs.promises.symlink(outsideDir, join(projectDir, "linked"), process.platform === "win32" ? "junction" : "dir")

    await expect(
      transferImportResult({
        projectDir,
        files: [{ sourceKind: "worker", sourcePath: workerYaml, targetProjectPath: "linked/escaped.yaml" }],
        concurrency: 1,
      })
    ).rejects.toThrow("вне Проекта")

    expect(await fs.promises.readFile(workerYaml, "utf8")).toBe("new escaped")
    await expect(fs.promises.stat(join(outsideDir, "escaped.yaml"))).rejects.toMatchObject({ code: "ENOENT" })
  })

  it("stops scheduling files after the first replacement failure without rollback", async () => {
    const root = await createTempDir("partial")
    const projectDir = join(root, "project")
    const workerDir = join(root, "worker")
    await fs.promises.mkdir(projectDir, { recursive: true })
    await fs.promises.mkdir(workerDir, { recursive: true })
    const files: ImportResultFile[] = []
    for (const name of ["first", "second", "third"]) {
      const sourcePath = join(workerDir, `${name}.yaml`)
      const targetProjectPath = `${name}.yaml`
      await fs.promises.writeFile(sourcePath, `new ${name}`)
      await fs.promises.writeFile(join(projectDir, targetProjectPath), `old ${name}`)
      files.push({ sourceKind: "worker", sourcePath, targetProjectPath })
    }
    const firstRenameSources: string[] = []
    const replacementTargets: string[] = []
    let replacementCount = 0

    await expect(
      transferImportResult(
        { projectDir, files, concurrency: 1 },
        {
          realpath: fs.promises.realpath,
          async mkdir(path) {
            await fs.promises.mkdir(path, { recursive: true })
          },
          async rename(source, target) {
            if (source.startsWith(workerDir)) firstRenameSources.push(basename(source))
            if (target.startsWith(projectDir) && !basename(target).startsWith(".")) {
              replacementCount += 1
              replacementTargets.push(relative(projectDir, target))
              if (replacementCount === 2) throw new Error("second replacement failed")
            }
            await fs.promises.rename(source, target)
          },
          copyFile: fs.promises.copyFile,
          async open(path) {
            return fs.promises.open(path, "r+")
          },
        }
      )
    ).rejects.toThrow("second replacement failed")

    expect(replacementTargets).toEqual(["first.yaml", "second.yaml"])
    expect(firstRenameSources).toEqual(["first.yaml", "second.yaml"])
    expect(await fs.promises.readFile(join(projectDir, "first.yaml"), "utf8")).toBe("new first")
    expect(await fs.promises.readFile(join(projectDir, "second.yaml"), "utf8")).toBe("old second")
    expect(await fs.promises.readFile(join(projectDir, "third.yaml"), "utf8")).toBe("old third")
    expect(await fs.promises.readFile(files[1]!.sourcePath, "utf8")).toBe("new second")
    expect(await fs.promises.readFile(files[2]!.sourcePath, "utf8")).toBe("new third")
    expect((await fs.promises.readdir(projectDir)).filter((name) => name.startsWith("."))).toEqual([])
  })
})

function workerFile(targetProjectPath: string): ImportResultFile {
  return { sourceKind: "worker", sourcePath: `/worker/${targetProjectPath}`, targetProjectPath }
}

function externalFile(targetProjectPath: string): ImportResultFile {
  return { sourceKind: "xml", sourcePath: `/xml/${targetProjectPath}`, targetProjectPath }
}

function recordingFileOperations(calls: string[]) {
  return {
    async realpath(path: string): Promise<string> {
      return path
    },
    async mkdir(): Promise<void> {
      calls.push("mkdir")
    },
    async rename(): Promise<void> {
      calls.push("rename")
    },
    async copyFile(): Promise<void> {
      calls.push("copyFile")
    },
    async open() {
      calls.push("open")
      return {
        async sync(): Promise<void> {
          calls.push("sync")
        },
        async close(): Promise<void> {
          calls.push("close")
        },
      }
    },
  }
}

async function createTempDir(name: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), `nkdk-import-transfer-${name}-`))
  tempDirs.push(directory)
  return directory
}
