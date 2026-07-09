import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { TopLevelMetadataItemRules } from "../appliedObjects/configuration/topLevelRules"
import {
  assertMetadataProjectPathInside,
  classifyMetadataProjectPath,
  discoverMetadataProjectResources,
  resolveMetadataProjectResource,
} from "./resources"

describe("metadata project resources", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  const createProject = (): string => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-project-resources-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  const touchProjectFile = (projectDir: string, projectPath: string): void => {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(resolve(filePath, ".."), { recursive: true })
    writeFileSync(filePath, "")
  }

  it("classifies virtual configuration, properties and form YAML paths", () => {
    expect(classifyMetadataProjectPath("Конфигурация.yaml")).toMatchObject({
      kind: "yaml",
      role: "configuration",
      projectPath: "Конфигурация.yaml",
      owner: { dir: "", name: "Конфигурация" },
    })

    expect(classifyMetadataProjectPath("Справочник/Новый/Свойства.yaml")).toMatchObject({
      kind: "yaml",
      role: "properties",
      owner: { dir: "Справочник", name: "Новый" },
      nesting: [],
    })

    expect(classifyMetadataProjectPath("Документ/Заказ/Формы/ФормаДокумента/Форма.yaml")).toMatchObject({
      kind: "yaml",
      role: "form",
      owner: { dir: "Документ", name: "Заказ" },
      formName: "ФормаДокумента",
    })
  })

  it("classifies virtual nested subsystem properties", () => {
    expect(
      classifyMetadataProjectPath(
        "Подсистема/Администрирование/Подсистемы/Настройки/Подсистемы/Интерфейс/Свойства.yaml"
      )
    ).toMatchObject({
      kind: "yaml",
      role: "properties",
      owner: { dir: "Подсистема", name: "Интерфейс" },
      nesting: [
        { dir: "Подсистема", name: "Администрирование" },
        { dir: "Подсистема", name: "Настройки" },
      ],
    })
  })

  it("does not classify migrations or malformed paths", () => {
    expect(classifyMetadataProjectPath("Миграции/0001.yaml")).toBeUndefined()
    expect(classifyMetadataProjectPath("Справочник/Товары/Команды/Команда.yaml")).toBeUndefined()
    expect(classifyMetadataProjectPath("Подсистема/Администрирование/Подсистемы/Свойства.yaml")).toBeUndefined()
    expect(classifyMetadataProjectPath("Подсистема//Подсистемы/Настройки/Свойства.yaml")).toBeUndefined()
    expect(classifyMetadataProjectPath("Подсистема/Администрирование/Подсистемы//Свойства.yaml")).toBeUndefined()
    expect(
      classifyMetadataProjectPath("Подсистема/Администрирование/Подсистемы/Настройки/Формы/Форма/Форма.yaml")
    ).toBeUndefined()
  })

  it("discovers existing metadata YAML resources", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Конфигурация.yaml")
    touchProjectFile(projectDir, "Справочник/Товары/Свойства.yaml")
    touchProjectFile(projectDir, "Справочник/Товары/Формы/ФормаСписка/Форма.yaml")
    touchProjectFile(projectDir, "Документ/Заказ/Свойства.yaml")
    touchProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml")
    touchProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml")

    const resources = discoverMetadataProjectResources(projectDir)

    expect(resources.map((file) => file.projectPath)).toEqual([
      "Документ/Заказ/Свойства.yaml",
      "Конфигурация.yaml",
      "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
    ])
    expect(resources.map((file) => file.absolutePath)).toEqual([
      join(projectDir, "Документ", "Заказ", "Свойства.yaml"),
      join(projectDir, "Конфигурация.yaml"),
      join(projectDir, "Подсистема", "Администрирование", "Подсистемы", "Настройки", "Свойства.yaml"),
      join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
      join(projectDir, "Справочник", "Товары", "Формы", "ФормаСписка", "Форма.yaml"),
    ])
  })

  it("discovers properties for every top-level metadata item with YAML directory", () => {
    const projectDir = createProject()
    const dirs = TopLevelMetadataItemRules.flatMap((rule) =>
      typeof rule.itemTypePrefix === "string" ? [rule.itemTypePrefix] : []
    )

    for (const dir of dirs) {
      touchProjectFile(projectDir, `${dir}/Тест/Свойства.yaml`)
    }

    expect(discoverMetadataProjectResources(projectDir).map((file) => file.projectPath)).toEqual(
      dirs.map((dir) => `${dir}/Тест/Свойства.yaml`).sort((left, right) => left.localeCompare(right, "ru"))
    )
  })

  it("resolves a single project resource with absolute path", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Справочник/Товары/Свойства.yaml")

    expect(resolveMetadataProjectResource(projectDir, "Справочник/Товары/Свойства.yaml")).toMatchObject({
      absolutePath: join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
      projectPath: "Справочник/Товары/Свойства.yaml",
      kind: "yaml",
      role: "properties",
      owner: {
        dir: "Справочник",
        name: "Товары",
      },
    })
  })

  it("rejects absolute files outside project root", () => {
    const projectDir = createProject()
    const outsidePath = resolve(projectDir, "..", "outside", "Справочник", "Товары", "Свойства.yaml")

    expect(() => assertMetadataProjectPathInside(projectDir, outsidePath)).toThrow(
      "Файл находится вне указанного YAML-проекта"
    )
  })
})
