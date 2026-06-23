import { mkdirSync, mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { describeMetadataProjectDirectoryStructure } from "./directoryStructure"
import { metadataProjectSpecs } from "./specs"

describe("metadata project directory structure", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  const createProject = (): string => {
    const projectDir = mkdtempSync(join(tmpdir(), "nakidka-project-structure-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  it("describes root project structure", () => {
    const projectDir = createProject()

    const result = describeMetadataProjectDirectoryStructure({ projectDir, depth: 1 })

    expect(result.directoryPath).toBe("")
    expect(result.depth).toBe(1)
    expect(result.node.children?.map((child) => child.name)).toContain("Конфигурация.yaml")
    expect(result.node.children?.map((child) => child.name)).toEqual(
      expect.arrayContaining(metadataProjectSpecs.map((spec) => spec.dir)),
    )
    expect(result.node.children?.find((child) => child.name === "Справочник")).toMatchObject({
      kind: "directory",
      role: "metadataKind",
      pathTemplate: "Справочник",
      repeatable: false,
    })
  })

  it("describes metadata kind directories with an object-name template", () => {
    const projectDir = createProject()

    const result = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: "Справочник",
      depth: 1,
    })

    expect(result.node).toMatchObject({
      name: "Справочник",
      kind: "directory",
      role: "metadataKind",
    })
    expect(result.node.children).toEqual([
      expect.objectContaining({
        name: "<ИмяОбъекта>",
        kind: "directory",
        role: "metadataObject",
        pathTemplate: "Справочник/<ИмяОбъекта>",
        repeatable: true,
      }),
    ])
  })

  it("describes object directories", () => {
    const projectDir = createProject()

    const result = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: "Документ/Заказ",
      depth: 1,
    })

    expect(result.node.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Свойства.yaml",
          kind: "file",
          role: "properties",
          pathTemplate: "Документ/Заказ/Свойства.yaml",
          required: true,
        }),
        expect.objectContaining({
          name: "Формы",
          kind: "directory",
          role: "forms",
          pathTemplate: "Документ/Заказ/Формы",
          required: false,
        }),
      ]),
    )
  })

  it("describes form collection and form directories", () => {
    const projectDir = createProject()

    const forms = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: "Справочник/Товары/Формы",
      depth: 1,
    })
    expect(forms.node.children).toEqual([
      expect.objectContaining({
        name: "<ИмяФормы>",
        kind: "directory",
        role: "form",
        pathTemplate: "Справочник/Товары/Формы/<ИмяФормы>",
        repeatable: true,
      }),
    ])

    const form = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: "Справочник/Товары/Формы/ФормаЭлемента",
      depth: 1,
    })
    expect(form.node.children).toEqual([
      expect.objectContaining({
        name: "Форма.yaml",
        kind: "file",
        role: "formYaml",
        pathTemplate: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
        required: true,
      }),
    ])
  })

  it("describes subsystem nesting without infinite recursion", () => {
    const projectDir = createProject()

    const result = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: "Подсистема/Администрирование",
    })

    expect(result.depth).toBeNull()
    expect(result.node.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Свойства.yaml", role: "properties" }),
        expect.objectContaining({
          name: "Подсистемы",
          kind: "directory",
          role: "subsystems",
          children: [
            expect.objectContaining({
              name: "<ИмяПодсистемы>",
              role: "subsystem",
              repeatable: true,
            }),
          ],
        }),
      ]),
    )
  })

  it("supports virtual directories that do not exist on disk", () => {
    const projectDir = createProject()

    const result = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: "Справочник/НовыйСправочник/Формы/НоваяФорма",
    })

    expect(result.node.children).toEqual([
      expect.objectContaining({
        name: "Форма.yaml",
        pathTemplate: "Справочник/НовыйСправочник/Формы/НоваяФорма/Форма.yaml",
      }),
    ])
  })

  it("rejects directories outside the project", () => {
    const projectDir = createProject()
    const outsideDir = createProject()

    expect(() =>
      describeMetadataProjectDirectoryStructure({
        projectDir,
        directoryPath: outsideDir,
      }),
    ).toThrow("Каталог находится вне указанного YAML-проекта")
  })

  it("rejects unsupported virtual directories and invalid depth", () => {
    const projectDir = createProject()

    expect(() =>
      describeMetadataProjectDirectoryStructure({
        projectDir,
        directoryPath: "Справочник/Товары/Команды",
      }),
    ).toThrow("Каталог не соответствует структуре metadata-проекта")

    expect(() =>
      describeMetadataProjectDirectoryStructure({
        projectDir,
        depth: 0,
      }),
    ).toThrow("depth должен быть положительным целым числом")
  })

  it("normalizes existing absolute directories inside the project", () => {
    const projectDir = createProject()
    const objectDir = join(projectDir, "Справочник", "Товары")
    mkdirSync(objectDir, { recursive: true })

    const result = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: objectDir,
      depth: 1,
    })

    expect(result.directoryPath).toBe("Справочник/Товары")
    expect(result.node.pathTemplate).toBe("Справочник/Товары")
  })

  it("limits child expansion by depth", () => {
    const projectDir = createProject()

    const result = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: "Справочник/Товары",
      depth: 1,
    })

    expect(result.node.children?.find((child) => child.name === "Формы")?.children).toBeUndefined()
  })
})
