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
  it("читает Форма.yaml как источник формы", () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")

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

    const changed = readChangedProjectSource(projectPath, yamlPath)

    expect(changed).toEqual({
      deleted: true,
      deletedFilePaths: [yamlPath],
    })
  })

  it("batch-нормализация игнорирует неподдержанный файл", () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const textPath = "Справочник/Товары/Формы/ФормаСписка/Форма.txt"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")
    writeProjectFile(projectPath, textPath, "не источник формы\n")

    const changed = readChangedProjectSources(projectPath, [textPath])

    expect(changed.deletedFilePaths).toEqual([])
    expect(changed.sources).toEqual([])
  })

  it("readChangedProjectSources читает форму Обработка через rule-driven YAML path", () => {
    const yamlPath = "Обработка/ЗагрузкаДанных/Формы/Форма/Форма.yaml"
    const projectPath = createProject({
      [yamlPath]: "Заголовок: Форма\n",
    })

    const changed = readChangedProjectSources(projectPath, [yamlPath])

    expect(changed.deletedFilePaths).toEqual([])
    expect(changed.sources).toMatchObject([
      {
        filePath: yamlPath,
      },
    ])
  })

  it("batch-нормализация не создаёт tombstone для неподдержанного файла", () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    const textPath = "Справочник/Товары/Формы/ФормаСписка/Форма.txt"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")

    const changed = readChangedProjectSources(projectPath, [textPath])

    expect(changed.sources).toEqual([])
    expect(changed.deletedFilePaths).toEqual([])
  })

  it("batch-нормализация не делает одинокий неподдержанный graph source", () => {
    const projectPath = createProject()
    const textPath = "Справочник/Товары/Формы/ФормаСписка/Форма.txt"
    writeProjectFile(projectPath, textPath, "не источник формы\n")

    const changed = readChangedProjectSources(projectPath, [textPath])

    expect(changed.sources).toEqual([])
    expect(changed.deletedFilePaths).toEqual([])
  })

  it("batch-нормализация удаляет только YAML при удалённой Форма.yaml", () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"

    const changed = readChangedProjectSources(projectPath, [yamlPath])

    expect(changed.sources).toEqual([])
    expect(changed.deletedFilePaths).toEqual([yamlPath])
  })
})
