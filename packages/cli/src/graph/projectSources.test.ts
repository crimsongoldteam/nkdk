import { mkdirSync, mkdtempSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { readChangedProjectSource, readProjectGraphSources } from "./projectSources"

const createProject = (): string => mkdtempSync(join(tmpdir(), "nakidka-project-sources-"))
const byteSize = (text: string): number => Buffer.byteLength(text)

const writeProjectFile = (projectPath: string, filePath: string, text: string): void => {
  const fullPath = join(projectPath, ...filePath.split("/"))
  mkdirSync(join(fullPath, ".."), { recursive: true })
  writeFileSync(fullPath, text)
}

describe("projectSources", () => {
  it("читает Форма.yaml вместе с paired Форма.nkdk и fileStats для обоих", () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")
    writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")

    const sources = readProjectGraphSources(projectPath)

    expect(sources).toHaveLength(1)
    expect(sources[0]).toMatchObject({
      filePath: yamlPath,
      text: "Элементы: {}\n",
      pairedText: {
        filePath: nkdkPath,
        text: "ПолеВвода1(Реквизит):\n",
      },
    })
    expect(sources.every((source) => source.fileStats !== undefined)).toBe(true)
    expect(sources[0].fileStats).toMatchObject({ size: byteSize("Элементы: {}\n") })
    expect(sources[0].pairedText?.fileStats).toMatchObject({
      size: byteSize("ПолеВвода1(Реквизит):\n"),
    })
  })

  it("нормализует absolute --file для Форма.nkdk в primary Форма.yaml с paired nkdk", () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")
    writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")

    const changed = readChangedProjectSource(projectPath, join(projectPath, ...nkdkPath.split("/")))

    expect(changed.deleted).toBe(false)
    expect(changed.deletedFilePaths).toEqual([])
    expect(changed.source?.filePath).toBe(yamlPath)
    expect(changed.source?.pairedText?.filePath).toBe(nkdkPath)
    expect(changed.source?.fileStats).toMatchObject({ size: byteSize("Элементы: {}\n") })
    expect(changed.source?.pairedText?.fileStats).toMatchObject({
      size: byteSize("ПолеВвода1(Реквизит):\n"),
    })
  })

  it("для удалённой Форма.yaml возвращает YAML и NKDK filePath для очистки", () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")

    const changed = readChangedProjectSource(projectPath, yamlPath)

    expect(changed).toEqual({
      deleted: true,
      deletedFilePaths: [yamlPath, nkdkPath],
    })
  })
})
