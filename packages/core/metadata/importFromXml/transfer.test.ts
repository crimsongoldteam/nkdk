import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import type { ImportResultFile } from "./types"
import { mergeImportResultFiles, transferXmlImportExternalFiles } from "./transfer"

const projectDir = resolve("/project")

describe("XML import result files", () => {
  it("rejects duplicate and escaping target paths before copying external files", async () => {
    expect(() => mergeImportResultFiles([workerFile("Конфигурация.yaml"), externalFile("Конфигурация.yaml")])).toThrow(
      "Повторный целевой путь"
    )
    expect(() => mergeImportResultFiles([workerFile("../outside.yaml")])).toThrow("вне Проекта")

    const calls: string[] = []
    await expect(
      transferXmlImportExternalFiles(
        { projectDir, files: [externalFile("../outside.txt")], concurrency: 1, transfer: "copy" },
        recordingFileOperations(calls)
      )
    ).rejects.toThrow("вне Проекта")
    expect(calls).toEqual([])
  })

  it("does not touch the file system when the result has no XML external files", async () => {
    const calls: string[] = []

    await transferXmlImportExternalFiles(
      {
        projectDir,
        files: [workerFile("Конфигурация.yaml")],
        concurrency: 1,
        transfer: "copy",
      },
      recordingFileOperations(calls)
    )

    expect(calls).toEqual([])
  })

  it.each([
    ["copy", "copyFile"],
    ["move", "rename"],
  ] as const)("uses %s for XML-owned files", async (transfer, operation) => {
    const calls: string[] = []
    const external = externalFile("МодульПриложения.bsl")

    await transferXmlImportExternalFiles(
      {
        projectDir,
        files: [workerFile("Конфигурация.yaml"), external],
        concurrency: 1,
        transfer,
      },
      recordingFileOperations(calls)
    )

    expect(calls).toContain(`${operation} ${external.sourcePath} -> ${resolve(projectDir, "МодульПриложения.bsl")}`)
  })

  it("rejects an existing symlink directory that resolves outside the Project before copying", async () => {
    const calls: string[] = []
    const operations = recordingFileOperations(calls, {
      [projectDir]: resolve("/real/project"),
      [resolve(projectDir, "linked")]: resolve("/outside"),
    })

    await expect(
      transferXmlImportExternalFiles({
        projectDir,
        files: [{ sourceKind: "xml", sourcePath: resolve("/xml/escaped.txt"), targetProjectPath: "linked/escaped.txt" }],
        concurrency: 1,
        transfer: "copy",
      }, operations)
    ).rejects.toThrow("вне Проекта")
    expect(calls).not.toContain(expect.stringMatching(/copyFile|rename/))
  })
})

function workerFile(targetProjectPath: string): ImportResultFile {
  return { sourceKind: "worker", sourcePath: resolve("/worker", ...targetProjectPath.split("/")), targetProjectPath }
}

function externalFile(targetProjectPath: string): ImportResultFile {
  return { sourceKind: "xml", sourcePath: resolve("/xml", ...targetProjectPath.split("/")), targetProjectPath }
}

function recordingFileOperations(calls: string[], realpaths: Record<string, string> = {}) {
  return {
    async realpath(path: string): Promise<string> {
      calls.push(`realpath ${path}`)
      return realpaths[path] ?? path
    },
    async mkdir(path: string): Promise<void> {
      calls.push(`mkdir ${path}`)
    },
    async copyFile(source: string, target: string): Promise<void> {
      calls.push(`copyFile ${source} -> ${target}`)
    },
    async rename(source: string, target: string): Promise<void> {
      calls.push(`rename ${source} -> ${target}`)
    },
  }
}
