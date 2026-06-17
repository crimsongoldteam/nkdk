import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, describe, expect, it } from "vitest"
import {
  assertProjectFileInside,
  discoverValidationProjectFiles,
  resolveValidationProjectFile,
} from "./projectFiles"

describe("validation project files", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  const createProject = (): string => {
    const projectDir = mkdtempSync(join(tmpdir(), "nakidka-project-files-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  const touchProjectFile = (projectDir: string, projectPath: string): void => {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(resolve(filePath, ".."), { recursive: true })
    writeFileSync(filePath, "")
  }

  it("discovers supported properties and form YAML files", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Справочник/Товары/Свойства.yaml")
    touchProjectFile(projectDir, "Справочник/Товары/Формы/ФормаСписка/Форма.yaml")
    touchProjectFile(projectDir, "Документ/Заказ/Свойства.yaml")
    touchProjectFile(projectDir, "Документ/Заказ/Формы/ФормаДокумента/Форма.yaml")
    touchProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml")
    touchProjectFile(projectDir, "Подсистема/Продажи/Свойства.yaml")

    const files = discoverValidationProjectFiles(projectDir)

    expect(files.map((file) => file.projectPath).sort()).toEqual([
      "Документ/Заказ/Свойства.yaml",
      "Документ/Заказ/Формы/ФормаДокумента/Форма.yaml",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
    ])
    expect(files.find((file) => file.projectPath.includes("Команды"))).toBeUndefined()
    expect(files.find((file) => file.projectPath.startsWith("Подсистема/"))).toBeUndefined()
  })

  it("discovers properties for owner kinds with existing metadata rules", () => {
    const projectDir = createProject()

    for (const dir of [
      "Отчет",
      "РегистрБухгалтерии",
      "РегистрРасчета",
      "ПланВидовРасчета",
      "ПланВидовХарактеристик",
      "БизнесПроцесс",
      "Задача",
    ]) {
      touchProjectFile(projectDir, `${dir}/Тест/Свойства.yaml`)
    }

    expect(discoverValidationProjectFiles(projectDir).map((file) => file.projectPath)).toEqual([
      "БизнесПроцесс/Тест/Свойства.yaml",
      "Задача/Тест/Свойства.yaml",
      "Отчет/Тест/Свойства.yaml",
      "ПланВидовРасчета/Тест/Свойства.yaml",
      "ПланВидовХарактеристик/Тест/Свойства.yaml",
      "РегистрБухгалтерии/Тест/Свойства.yaml",
      "РегистрРасчета/Тест/Свойства.yaml",
    ])
  })

  it("resolves a single relative properties file", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Справочник/Товары/Свойства.yaml")

    const file = resolveValidationProjectFile(projectDir, "Справочник/Товары/Свойства.yaml")

    expect(file).toMatchObject({
      absolutePath: join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
      projectPath: "Справочник/Товары/Свойства.yaml",
      kind: "properties",
      owner: {
        dir: "Справочник",
        name: "Товары",
        spec: expect.objectContaining({ dir: "Справочник" }),
      },
    })
    expect(file?.formName).toBeUndefined()
  })

  it("resolves a single absolute form file", () => {
    const projectDir = createProject()
    const absolutePath = join(projectDir, "Документ", "Заказ", "Формы", "ФормаДокумента", "Форма.yaml")
    touchProjectFile(projectDir, "Документ/Заказ/Формы/ФормаДокумента/Форма.yaml")

    const file = resolveValidationProjectFile(projectDir, absolutePath)

    expect(file).toMatchObject({
      absolutePath,
      projectPath: "Документ/Заказ/Формы/ФормаДокумента/Форма.yaml",
      kind: "form",
      owner: {
        dir: "Документ",
        name: "Заказ",
        spec: expect.objectContaining({ dir: "Документ" }),
      },
      formName: "ФормаДокумента",
    })
  })

  it("rejects files outside the project", () => {
    const projectDir = createProject()
    const outsidePath = resolve(projectDir, "..", "outside", "Справочник", "Товары", "Свойства.yaml")

    expect(() => assertProjectFileInside(projectDir, outsidePath)).toThrow(
      "Файл находится вне указанного YAML-проекта",
    )
  })

  it("returns undefined for unsupported YAML files inside the project", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml")
    touchProjectFile(projectDir, "Подсистема/Продажи/Свойства.yaml")

    expect(resolveValidationProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml")).toBeUndefined()
    expect(resolveValidationProjectFile(projectDir, "Подсистема/Продажи/Свойства.yaml")).toBeUndefined()
    expect(discoverValidationProjectFiles(projectDir)).toEqual([])
  })
})
