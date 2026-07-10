import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { TopLevelMetadataItemRules } from "../appliedObjects/configuration/topLevelRules"
import { assertProjectFileInside, discoverValidationProjectFiles, resolveValidationProjectFile } from "./projectFiles"
import { validationProjectSpecs } from "./projectSpecs"

describe("validation project files", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  const createProject = (): string => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-project-files-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  const touchProjectFile = (projectDir: string, projectPath: string): void => {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(resolve(filePath, ".."), { recursive: true })
    writeFileSync(filePath, "")
  }

  it("has validation specs for every top-level metadata object with YAML directory", () => {
    const topLevelDirs = TopLevelMetadataItemRules.flatMap((rule) =>
      typeof rule.itemTypePrefix === "string" ? [rule.itemTypePrefix] : []
    ).sort((left, right) => left.localeCompare(right, "ru"))

    const validationDirs = validationProjectSpecs
      .map((spec) => spec.dir)
      .sort((left, right) => left.localeCompare(right, "ru"))

    expect(validationDirs).toEqual(topLevelDirs)
  })

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
      "Подсистема/Продажи/Свойства.yaml",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
    ])
    expect(files.find((file) => file.projectPath.includes("Команды"))).toBeUndefined()
  })

  it("discovers properties for every top-level metadata object with YAML directory", () => {
    const projectDir = createProject()
    const dirs = TopLevelMetadataItemRules.flatMap((rule) =>
      typeof rule.itemTypePrefix === "string" ? [rule.itemTypePrefix] : []
    )

    for (const dir of dirs) {
      touchProjectFile(projectDir, `${dir}/Тест/Свойства.yaml`)
    }

    expect(discoverValidationProjectFiles(projectDir).map((file) => file.projectPath)).toEqual(
      dirs.map((dir) => `${dir}/Тест/Свойства.yaml`).sort((left, right) => left.localeCompare(right, "ru"))
    )
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

  it("discovers and resolves nested subsystem properties", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Подсистема/Администрирование/Свойства.yaml")
    touchProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml")
    touchProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Подсистемы/Интерфейс/Свойства.yaml")

    const files = discoverValidationProjectFiles(projectDir)

    expect(files.map((file) => file.projectPath).sort()).toEqual([
      "Подсистема/Администрирование/Подсистемы/Настройки/Подсистемы/Интерфейс/Свойства.yaml",
      "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml",
      "Подсистема/Администрирование/Свойства.yaml",
    ])

    expect(
      resolveValidationProjectFile(
        projectDir,
        "Подсистема/Администрирование/Подсистемы/Настройки/Подсистемы/Интерфейс/Свойства.yaml"
      )
    ).toMatchObject({
      projectPath: "Подсистема/Администрирование/Подсистемы/Настройки/Подсистемы/Интерфейс/Свойства.yaml",
      kind: "properties",
      owner: {
        dir: "Подсистема",
        name: "Интерфейс",
        spec: expect.objectContaining({ dir: "Подсистема" }),
      },
    })
  })

  it("does not resolve malformed nested subsystem paths or nested subsystem forms", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Свойства.yaml")
    touchProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Формы/Форма/Форма.yaml")

    expect(
      resolveValidationProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Свойства.yaml")
    ).toBeUndefined()
    expect(
      resolveValidationProjectFile(
        projectDir,
        "Подсистема/Администрирование/Подсистемы/Настройки/Формы/Форма/Форма.yaml"
      )
    ).toBeUndefined()
    expect(discoverValidationProjectFiles(projectDir)).toEqual([])
  })

  it("rejects files outside the project", () => {
    const projectDir = createProject()
    const outsidePath = resolve(projectDir, "..", "outside", "Справочник", "Товары", "Свойства.yaml")

    expect(() => assertProjectFileInside(projectDir, outsidePath)).toThrow("Файл находится вне указанного YAML-проекта")
  })

  it("returns undefined for unsupported YAML files inside the project", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml")

    expect(resolveValidationProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml")).toBeUndefined()
    expect(discoverValidationProjectFiles(projectDir)).toEqual([])
  })

  it("discovers and resolves the root configuration YAML file", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Конфигурация.yaml")

    expect(discoverValidationProjectFiles(projectDir)).toEqual([
      expect.objectContaining({
        projectPath: "Конфигурация.yaml",
        kind: "configuration",
        owner: expect.objectContaining({
          dir: "",
          name: "Конфигурация",
          spec: expect.objectContaining({ kind: "configuration" }),
        }),
      }),
    ])

    expect(resolveValidationProjectFile(projectDir, "Конфигурация.yaml")).toMatchObject({
      absolutePath: join(projectDir, "Конфигурация.yaml"),
      projectPath: "Конфигурация.yaml",
      kind: "configuration",
      owner: {
        dir: "",
        name: "Конфигурация",
        spec: expect.objectContaining({ kind: "configuration" }),
      },
    })
  })
})
