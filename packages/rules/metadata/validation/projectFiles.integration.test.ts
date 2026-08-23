import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { TopLevelMetadataItemRules } from "../appliedObjects/configuration/topLevelRules"
import { discoverValidationProjectComponents } from "./projectComponents"
import {
  assertProjectFileInside,
  createValidationProjectAssignmentFileProjector,
  discoverValidationProjectFiles,
  resolveValidationProjectFile,
} from "./projectFiles"
import { getValidationProjectSpecs } from "./projectSpecs"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { MetadataConfigurationRules } from "../appliedObjects/configuration/rules"
import { MetadataExternalDataSourceCubeRules } from "../commonObjects/metadataExternalDataSourceCube/rules"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import { projectSpecFixturePaths } from "../../tests/projectSpecFixturePath"

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
    const topLevelDirs = TopLevelMetadataItemRules
      .map(({ itemTypePrefix }) => itemTypePrefix)
      .filter((dir): dir is string => typeof dir === "string")
      .sort((left, right) => left.localeCompare(right, "ru"))

    const validationDirs = getValidationProjectSpecs()
      .map((spec) => spec.dir)
      .sort((left, right) => left.localeCompare(right, "ru"))

    expect(validationDirs).toEqual(topLevelDirs)
  })

  it("discovers supported properties and form YAML files", async () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Справочник/Товары/Свойства.yaml")
    touchProjectFile(projectDir, "Справочник/Товары/Формы/ФормаСписка/Форма.yaml")
    touchProjectFile(projectDir, "Документ/Заказ/Свойства.yaml")
    touchProjectFile(projectDir, "Документ/Заказ/Формы/ФормаДокумента/Форма.yaml")
    touchProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml")
    touchProjectFile(projectDir, "Подсистема/Продажи/Свойства.yaml")

    const files = await discoverValidationProjectFiles(projectDir)

    expect(files.map((file) => file.projectPath).sort()).toEqual([
      "Документ/Заказ/Свойства.yaml",
      "Документ/Заказ/Формы/ФормаДокумента/Форма.yaml",
      "Подсистема/Продажи/Свойства.yaml",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
    ])
    expect(files.find((file) => file.projectPath.includes("Команды"))).toBeUndefined()
  })

  it("discovers properties for every top-level metadata object with YAML directory", async () => {
    const projectDir = createProject()
    const projectPaths = projectSpecFixturePaths(getValidationProjectSpecs(), "Тест")

    for (const projectPath of projectPaths) touchProjectFile(projectDir, projectPath)

    expect((await discoverValidationProjectFiles(projectDir)).map((file) => file.projectPath)).toEqual(
      projectPaths,
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
      itemType: "MetadataCatalog",
      itemRule: MetadataCatalogRules,
      metadataTarget: {
        canonical: "Catalog.Товары",
      },
      owner: {
        dir: "Справочник",
        name: "Товары",
        spec: expect.objectContaining({ dir: "Справочник" }),
      },
    })
    expect(file?.formName).toBeUndefined()
  })

  it("проецирует файл из topology-адреса без повторного распознавания пути", async () => {
    const projectDir = createProject()
    mkdirSync(join(projectDir, "cf"))
    const component = (await discoverValidationProjectComponents(projectDir)).components[0]!
    const assignment = component.topology.assignments.find(
      ({ projectPattern }) => projectPattern === "Справочник/{ownerName}/Свойства.yaml",
    )!
    const project = createValidationProjectAssignmentFileProjector(projectDir, component)

    expect(project({
      projectPath: "Справочник/этот-путь-не-соответствует-шаблону.yaml",
      topologyAddress: { nodeId: assignment.id, values: { ownerName: "ИзАдреса" } },
    })).toMatchObject({
      projectPath: "Справочник/этот-путь-не-соответствует-шаблону.yaml",
      kind: "properties",
      itemType: "MetadataCatalog",
      owner: { dir: "Справочник", name: "ИзАдреса" },
      metadataTarget: { canonical: "Catalog.ИзАдреса" },
    })
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
      itemType: "ClientApplicationForm",
      itemRule: ClientApplicationFormRules,
      metadataTarget: {
        canonical: "Document.Заказ.Form.ФормаДокумента",
      },
      owner: {
        dir: "Документ",
        name: "Заказ",
        spec: expect.objectContaining({ dir: "Документ" }),
      },
      formName: "ФормаДокумента",
    })
  })

  it("discovers and resolves nested subsystem properties", async () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Подсистема/Администрирование/Свойства.yaml")
    touchProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml")
    touchProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Подсистемы/Интерфейс/Свойства.yaml")

    const files = await discoverValidationProjectFiles(projectDir)

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
      itemRule: expect.objectContaining({ itemType: "MetadataSubsystem" }),
      metadataTarget: {
        canonical: "Subsystem.Администрирование.Subsystem.Настройки.Subsystem.Интерфейс",
      },
      owner: {
        dir: "Подсистема",
        name: "Интерфейс",
        spec: expect.objectContaining({ dir: "Подсистема" }),
      },
    })
  })

  it("does not resolve malformed nested subsystem paths or nested subsystem forms", async () => {
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
    expect(await discoverValidationProjectFiles(projectDir)).toEqual([])
  })

  it("rejects files outside the project", () => {
    const projectDir = createProject()
    const outsidePath = resolve(projectDir, "..", "outside", "Справочник", "Товары", "Свойства.yaml")

    expect(() => assertProjectFileInside(projectDir, outsidePath)).toThrow("Файл находится вне указанного YAML-проекта")
  })

  it("returns undefined for unsupported YAML files inside the project", async () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml")

    expect(resolveValidationProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml")).toBeUndefined()
    expect(await discoverValidationProjectFiles(projectDir)).toEqual([])
  })

  it("discovers and resolves the root configuration YAML file", async () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Конфигурация.yaml")

    expect(await discoverValidationProjectFiles(projectDir)).toEqual([
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
      itemType: "MetadataConfiguration",
      itemRule: MetadataConfigurationRules,
      owner: {
        dir: "",
        name: "Конфигурация",
        spec: expect.objectContaining({ kind: "configuration" }),
      },
    })
    expect(resolveValidationProjectFile(projectDir, "Конфигурация.yaml")?.metadataTarget).toBeUndefined()
  })

  it("resolves a nested file item with its own rule and full target", () => {
    const projectDir = createProject()
    const projectPath = "ВнешнийИсточникДанных/Источник/Кубы/Куб/Свойства.yaml"
    touchProjectFile(projectDir, projectPath)

    expect(resolveValidationProjectFile(projectDir, projectPath)).toMatchObject({
      kind: "properties",
      itemType: "MetadataExternalDataSourceCube",
      itemRule: MetadataExternalDataSourceCubeRules,
      metadataTarget: {
        canonical: "ExternalDataSource.Источник.Cube.Куб",
      },
    })
  })

  it("discovers files with their component address", async () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "cf/Справочник/Товары/Свойства.yaml")
    const component = (await discoverValidationProjectComponents(projectDir)).components[0]!

    expect(await discoverValidationProjectFiles(component.componentDir, component)).toEqual([
      expect.objectContaining({
        componentPath: "cf",
        componentDir: join(projectDir, "cf"),
        projectPath: "Справочник/Товары/Свойства.yaml",
        rootProjectPath: "cf/Справочник/Товары/Свойства.yaml",
      }),
    ])
  })
})
