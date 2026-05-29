import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { afterEach, describe, expect, it } from "vitest"
import { exportJSONSchemaForProjectFile, ProjectFileSchemaError } from "./projectFileSchema"
import { validateFile } from "./validateFile"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("exportJSONSchemaForProjectFile", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  const createProject = (): string => {
    const projectDir = mkdtempSync(join(tmpdir(), "nakidka-schema-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  it("exports catalog schema for absolute properties path", () => {
    const projectDir = createProject()
    const filePath = join(projectDir, "Справочник", "Товары", "Свойства.yaml")

    const schema = exportJSONSchemaForProjectFile({ context, filePath })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Синоним: expect.any(Object),
      }),
    })
  })

  it("exports document schema for project-relative properties path", () => {
    const projectDir = createProject()

    const schema = exportJSONSchemaForProjectFile({
      context,
      projectDir,
      filePath: "Документ/Заказ/Свойства.yaml",
    })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        СтандартныеРеквизиты: expect.any(Object),
      }),
    })
  })

  it("exports client form schema for form YAML path", () => {
    const schema = exportJSONSchemaForProjectFile({
      context,
      filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
    })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        АвтоЗаголовок: expect.any(Object),
        Синоним: expect.any(Object),
      }),
    })
  })

  it("rejects non-yaml files", () => {
    expect(() =>
      exportJSONSchemaForProjectFile({
        context,
        filePath: "Справочник/Товары/МодульМенеджера.bsl",
      })
    ).toThrow(new ProjectFileSchemaError("JSON Schema поддерживается только для .yaml файлов"))
  })

  it("rejects unsupported project paths with expected patterns", () => {
    expect(() =>
      exportJSONSchemaForProjectFile({
        context,
        filePath: "Справочник/Товары/Команды/Команда.yaml",
      })
    ).toThrow(/Ожидались пути вида/)
  })

  it("rejects a file outside explicit project directory", () => {
    const projectDir = createProject()
    const outsidePath = resolve(projectDir, "..", "outside", "Справочник", "Товары", "Свойства.yaml")

    expect(() =>
      exportJSONSchemaForProjectFile({
        context,
        projectDir,
        filePath: outsidePath,
      })
    ).toThrow(new ProjectFileSchemaError("Файл находится вне указанного YAML-проекта"))
  })

  it("validates catalog attribute TypeDescription with catalog-specific restrictions", () => {
    const schema = TypeCompiler.Compile(
      exportJSONSchemaForProjectFile({
        context,
        filePath: "Справочник/Товары/Свойства.yaml",
      })
    )

    expect(
      validateFile({
        filePath: "Справочник/Товары/Свойства.yaml",
        schema,
        text: ["Реквизиты:", "  Контрагент:", "    Тип:", "      - Справочник", "      - Справочник.Контрагенты"].join(
          "\n"
        ),
      })
    ).toEqual([])

    expect(
      validateFile({
        filePath: "Справочник/Товары/Свойства.yaml",
        schema,
        text: ["Реквизиты:", "  Артикул: Строка"].join("\n"),
      })
    ).toEqual([])

    expect(
      validateFile({
        filePath: "Справочник/Товары/Свойства.yaml",
        schema,
        text: ["Реквизиты:", "  Неверный:", "    Тип: НесуществующийТип"].join("\n"),
      })
    ).not.toEqual([])

    expect(
      validateFile({
        filePath: "Справочник/Товары/Свойства.yaml",
        schema,
        text: ["Реквизиты:", "  Таблица:", "    Тип:", "      - Строка", "      - ХранилищеЗначения"].join("\n"),
      })
    ).not.toEqual([])
  })

  it("keeps document attribute TypeDescription broad in the first version", () => {
    const schema = TypeCompiler.Compile(
      exportJSONSchemaForProjectFile({
        context,
        filePath: "Документ/Заказ/Свойства.yaml",
      })
    )

    expect(
      validateFile({
        filePath: "Документ/Заказ/Свойства.yaml",
        schema,
        text: ["Реквизиты:", "  ПокаШирокий:", "    Тип: НесуществующийТип"].join("\n"),
      })
    ).toEqual([])

    expect(
      validateFile({
        filePath: "Документ/Заказ/Свойства.yaml",
        schema,
        text: ["Реквизиты:", "  ПокаШирокий: НесуществующийТип"].join("\n"),
      })
    ).toEqual([])
  })
})
