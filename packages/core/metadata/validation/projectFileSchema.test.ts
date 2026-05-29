import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { afterEach, describe, expect, it } from "vitest"
import {
  exportJSONSchemaForProjectFile,
  exportJSONSchemaForSchemaName,
  ProjectFileSchemaError,
} from "./projectFileSchema"
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

  it("exports compact catalog schema for absolute properties path by default", () => {
    const projectDir = createProject()
    const filePath = join(projectDir, "Справочник", "Товары", "Свойства.yaml")

    const schema = exportJSONSchemaForProjectFile({ context, filePath })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Реквизиты: expect.objectContaining({
          type: "object",
          additionalProperties: expect.objectContaining({
            $ref: "nkdk://schema/MetadataCatalogAttribute",
          }),
        }),
      }),
      "x-nkdk-schemaRefs": expect.arrayContaining(["nkdk://schema/MetadataCatalogAttribute"]),
    })
  })

  it("exports inline catalog schema for properties path in inline mode", () => {
    const schema = exportJSONSchemaForProjectFile({
      context,
      filePath: "Справочник/Товары/Свойства.yaml",
      mode: "inline",
    })

    expect(JSON.stringify(schema)).not.toContain("nkdk://schema/MetadataCatalogAttribute")
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
        mode: "inline",
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

    expect(
      validateFile({
        filePath: "Справочник/Товары/Свойства.yaml",
        schema,
        text: [
          "Реквизиты:",
          "  Идентификатор:",
          "    ИдентификаторТипа:",
          "      - 8c1e3694-da12-44d5-8b1f-d134b89a1282",
        ].join("\n"),
      })
    ).not.toEqual([])
  })

  it("keeps document attribute TypeDescription broad in the first version", () => {
    const schema = TypeCompiler.Compile(
      exportJSONSchemaForProjectFile({
        context,
        filePath: "Документ/Заказ/Свойства.yaml",
        mode: "inline",
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

    expect(
      validateFile({
        filePath: "Документ/Заказ/Свойства.yaml",
        schema,
        text: [
          "Реквизиты:",
          "  Идентификатор:",
          "    ИдентификаторТипа:",
          "      - 8c1e3694-da12-44d5-8b1f-d134b89a1282",
        ].join("\n"),
      })
    ).toEqual([])

    expect(
      validateFile({
        filePath: "Документ/Заказ/Свойства.yaml",
        schema,
        text: ["Реквизиты:", "  Идентификатор:", "    ИдентификаторТипа: []"].join("\n"),
      })
    ).not.toEqual([])

    expect(
      validateFile({
        filePath: "Документ/Заказ/Свойства.yaml",
        schema,
        text: ["Реквизиты:", "  Идентификатор:", "    Тип: {}"].join("\n"),
      })
    ).not.toEqual([])
  })
})

describe("exportJSONSchemaForSchemaName", () => {
  it("exports schema by registered name", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "InputField" })

    expect(schema).toMatchObject({
      properties: expect.objectContaining({
        Вид: expect.objectContaining({ const: "ПолеВвода" }),
      }),
    })
  })

  it("reports unknown schema names", () => {
    expect(() => exportJSONSchemaForSchemaName({ context, name: "UnknownSchema" })).toThrow(
      /Неизвестная JSON Schema "UnknownSchema"/
    )
  })
})
