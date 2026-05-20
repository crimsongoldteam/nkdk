import { mkdirSync, mkdtempSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import {
  readChangedProjectSource,
  readChangedProjectSources,
  readProjectGraphSources,
} from "./projectSources"

const createProject = (files: Record<string, string> = {}): string => {
  const projectPath = mkdtempSync(join(tmpdir(), "nakidka-project-sources-"))
  for (const [filePath, text] of Object.entries(files)) {
    writeProjectFile(projectPath, filePath, text)
  }
  return projectPath
}
const byteSize = (text: string): number => Buffer.byteLength(text)

const writeProjectFile = (projectPath: string, filePath: string, text: string): void => {
  const fullPath = join(projectPath, ...filePath.split("/"))
  mkdirSync(join(fullPath, ".."), { recursive: true })
  writeFileSync(fullPath, text)
}

describe("projectSources", () => {
  it("читает Форма.yaml без парного Форма.nkdk", () => {
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
    })
    expect(sources.every((source) => source.fileStats !== undefined)).toBe(true)
    expect(sources[0].fileStats).toMatchObject({ size: byteSize("Элементы: {}\n") })
  })

  it("нормализует absolute --file для Форма.yaml", () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")

    const changed = readChangedProjectSource(projectPath, join(projectPath, ...yamlPath.split("/")))

    expect(changed.deleted).toBe(false)
    expect(changed.deletedFilePaths).toEqual([])
    expect(changed.source?.filePath).toBe(yamlPath)
    expect(changed.source?.fileStats).toMatchObject({ size: byteSize("Элементы: {}\n") })
  })

  it("для удалённой Форма.yaml возвращает только YAML filePath для очистки", () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")

    const changed = readChangedProjectSource(projectPath, yamlPath)

    expect(changed).toEqual({
      deleted: true,
      deletedFilePaths: [yamlPath],
    })
  })

  it("batch-нормализация игнорирует устаревший Форма.nkdk", () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")
    writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")

    const changed = readChangedProjectSources(projectPath, [nkdkPath])

    expect(changed.deletedFilePaths).toEqual([])
    expect(changed.sources).toEqual([])
  })

  it("readChangedProjectSources читает форму Обработка через rule-driven YAML path", () => {
    const yamlPath = "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml"
    const nkdkPath = "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.nkdk"
    const projectPath = createProject({
      [yamlPath]: "Заголовок: Форма\n",
      [nkdkPath]: "Элементы:\n",
    })

    const changed = readChangedProjectSources(projectPath, [yamlPath])

    expect(changed.deletedFilePaths).toEqual([])
    expect(changed.sources).toMatchObject([
      {
        filePath: yamlPath,
      },
    ])
  })

  it("batch-нормализация не создаёт tombstone для Форма.nkdk при сохранённом Форма.yaml", () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")

    const changed = readChangedProjectSources(projectPath, [nkdkPath])

    expect(changed.sources).toEqual([])
    expect(changed.deletedFilePaths).toEqual([])
  })

  it("batch-нормализация не делает одинокий Форма.nkdk graph source", () => {
    const projectPath = createProject()
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")

    const changed = readChangedProjectSources(projectPath, [nkdkPath])

    expect(changed.sources).toEqual([])
    expect(changed.deletedFilePaths).toEqual([])
  })

  it("batch-нормализация удаляет только YAML при удалённой Форма.yaml", () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const nkdkPath = "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"
    writeProjectFile(projectPath, nkdkPath, "ПолеВвода1(Реквизит):\n")

    const changed = readChangedProjectSources(projectPath, [yamlPath])

    expect(changed.sources).toEqual([])
    expect(changed.deletedFilePaths).toEqual([yamlPath])
  })
})
