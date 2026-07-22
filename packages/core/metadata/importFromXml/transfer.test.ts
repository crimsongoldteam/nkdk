import fs from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import type { ImportResultFile } from "./types"
import { copyXmlImportExternalFiles, mergeImportResultFiles } from "./transfer"

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe("XML import result files", () => {
  it("rejects duplicate and escaping target paths before copying external files", async () => {
    expect(() => mergeImportResultFiles([workerFile("Конфигурация.yaml"), externalFile("Конфигурация.yaml")])).toThrow(
      "Повторный целевой путь"
    )
    expect(() => mergeImportResultFiles([workerFile("../outside.yaml")])).toThrow("вне Проекта")

    const calls: string[] = []
    await expect(
      copyXmlImportExternalFiles(
        { projectDir: "/project", files: [externalFile("../outside.txt")], concurrency: 1 },
        recordingFileOperations(calls)
      )
    ).rejects.toThrow("вне Проекта")
    expect(calls).toEqual([])
  })

  it("copies only XML external files because worker files are already in the project", async () => {
    const root = await createTempDir("copy")
    const projectDir = join(root, "project")
    const workerYaml = join(projectDir, "Конфигурация.yaml")
    const xmlModule = join(root, "xml", "МодульПриложения.bsl")
    const yamlText = "name: Конфигурация\n"
    const moduleText = 'Сообщить("Импорт");\n'
    await fs.promises.mkdir(dirname(workerYaml), { recursive: true })
    await fs.promises.mkdir(dirname(xmlModule), { recursive: true })
    await fs.promises.writeFile(workerYaml, yamlText)
    await fs.promises.writeFile(xmlModule, moduleText)
    const files = [
      { sourceKind: "worker", sourcePath: workerYaml, targetProjectPath: "Конфигурация.yaml" },
      { sourceKind: "xml", sourcePath: xmlModule, targetProjectPath: "МодульПриложения.bsl" },
    ] as const

    await copyXmlImportExternalFiles({ projectDir, files, concurrency: 2 })

    expect(await fs.promises.readFile(workerYaml, "utf8")).toBe(yamlText)
    expect(await fs.promises.readFile(xmlModule, "utf8")).toBe(moduleText)
    expect(await fs.promises.readFile(join(projectDir, "МодульПриложения.bsl"), "utf8")).toBe(moduleText)
  })

  it("does not touch the file system when the result has no XML external files", async () => {
    const calls: string[] = []

    await copyXmlImportExternalFiles(
      {
        projectDir: "/project",
        files: [workerFile("Конфигурация.yaml")],
        concurrency: 1,
      },
      recordingFileOperations(calls)
    )

    expect(calls).toEqual([])
  })

  it("copies XML external files directly without moving worker files", async () => {
    const calls: string[] = []

    await copyXmlImportExternalFiles(
      {
        projectDir: "/project",
        files: [workerFile("Конфигурация.yaml"), externalFile("МодульПриложения.bsl")],
        concurrency: 1,
      },
      recordingFileOperations(calls)
    )

    expect(calls).toEqual([
      "realpath /project",
      "realpath /project",
      "mkdir /project",
      "copyFile /xml/МодульПриложения.bsl -> /project/МодульПриложения.bsl",
    ])
  })

  it("rejects an existing symlink directory that resolves outside the Project before copying", async () => {
    const root = await createTempDir("symlink")
    const projectDir = join(root, "project")
    const outsideDir = join(root, "outside")
    const xmlFile = join(root, "xml", "escaped.txt")
    await fs.promises.mkdir(dirname(xmlFile), { recursive: true })
    await fs.promises.mkdir(projectDir, { recursive: true })
    await fs.promises.mkdir(outsideDir, { recursive: true })
    await fs.promises.writeFile(xmlFile, "new escaped")
    await fs.promises.symlink(outsideDir, join(projectDir, "linked"), process.platform === "win32" ? "junction" : "dir")

    await expect(
      copyXmlImportExternalFiles({
        projectDir,
        files: [{ sourceKind: "xml", sourcePath: xmlFile, targetProjectPath: "linked/escaped.txt" }],
        concurrency: 1,
      })
    ).rejects.toThrow("вне Проекта")

    await expect(fs.promises.stat(join(outsideDir, "escaped.txt"))).rejects.toMatchObject({ code: "ENOENT" })
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
      calls.push(`realpath ${path}`)
      return path
    },
    async mkdir(path: string): Promise<void> {
      calls.push(`mkdir ${path}`)
    },
    async copyFile(source: string, target: string): Promise<void> {
      calls.push(`copyFile ${source} -> ${target}`)
    },
  }
}

async function createTempDir(name: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), `nkdk-import-transfer-${name}-`))
  tempDirs.push(directory)
  return directory
}
