import { compileValidationSchema } from "./compileValidationSchema"
import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION } from "../helpers/excludeIfEqualNameYAML"
import {
  exportJSONSchemaGraph,
  exportJSONSchemaForProjectFile,
  exportJSONSchemaForSchemaName,
  ProjectFileSchemaError,
} from "./projectFileSchema"
import { validateFile } from "./validateFile"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

const inlineSchemaPaths = [
  "Справочник/Товары/Свойства.yaml",
  "Документ/Заказ/Свойства.yaml",
  "ПланВидовХарактеристик/ВидыСубконто/Свойства.yaml",
] as const
const inlineSchemas = new Map<string, ReturnType<typeof exportJSONSchemaForProjectFile>>()
const compiledInlineSchemas = new Map<string, ReturnType<typeof compileValidationSchema>>()
let formSchemaGraph: ReturnType<typeof exportJSONSchemaGraph>
let genericCatalogSchema: ReturnType<typeof compileValidationSchema>

beforeAll(() => {
  for (const filePath of inlineSchemaPaths) {
    const schema = exportJSONSchemaForProjectFile({ context, filePath, mode: "inline" })
    const compiled = compileValidationSchema(schema)
    compiled.Check(undefined)
    inlineSchemas.set(filePath, schema)
    compiledInlineSchemas.set(filePath, compiled)
  }
  formSchemaGraph = exportJSONSchemaGraph({
    context,
    roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
  })
  genericCatalogSchema = compileValidationSchema(
    exportJSONSchemaForSchemaName({ context, name: "MetadataCatalog", mode: "inline" })
  )
  genericCatalogSchema.Check(undefined)
})

describe("exportJSONSchemaForProjectFile", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  const createProject = (): string => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-schema-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  it("exports configuration schema for virtual root configuration path", () => {
    const schema = exportJSONSchemaForProjectFile({
      context,
      filePath: "Конфигурация.yaml",
    })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Имя: expect.any(Object),
      }),
    })
  })

  it("exports nested subsystem schema from virtual nested subsystem path", () => {
    const schema = exportJSONSchemaForProjectFile({
      context,
      filePath: "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml",
    })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Синоним: expect.any(Object),
      }),
    })
  })

  it("exports schema for a new properties file that does not exist on disk", () => {
    const projectDir = createProject()

    const schema = exportJSONSchemaForProjectFile({
      context,
      projectDir,
      filePath: "Справочник/НовыйСправочник/Свойства.yaml",
    })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Реквизиты: expect.any(Object),
      }),
    })
  })

  it("exports compact catalog schema for project-relative properties path by default", () => {
    const projectDir = createProject()
    const filePath = "Справочник/Товары/Свойства.yaml"

    const schema = exportJSONSchemaForProjectFile({ context, projectDir, filePath })

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

  it("exports compact catalog schema for absolute properties path inside explicit project", () => {
    const projectDir = createProject()
    const filePath = join(projectDir, "Справочник", "Товары", "Свойства.yaml")

    const schema = exportJSONSchemaForProjectFile({ context, projectDir, filePath })

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
    const schema = requiredMapValue(inlineSchemas, "Справочник/Товары/Свойства.yaml")

    expect(JSON.stringify(schema)).not.toContain("nkdk://schema/MetadataCatalogAttribute")
    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Синоним: expect.any(Object),
      }),
    })
  })

  it("describes equal-name exclusion without making the schema name-dependent", () => {
    const schema = requiredMapValue(inlineSchemas, "Справочник/Товары/Свойства.yaml")
    const synonymSchema = propertySchema(schema, "Синоним")

    expect(synonymSchema.description).toBe(EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION)
    expect(JSON.stringify(synonymSchema)).not.toContain("Какое то поле")
    expect(JSON.stringify(synonymSchema)).not.toContain('"not"')

    expect(
      validateFile({
        filePath: "Справочник/КакоеТоПоле/Свойства.yaml",
        schema: requiredMapValue(compiledInlineSchemas, "Справочник/Товары/Свойства.yaml"),
        text: "Синоним: Какое то поле\n",
      })
    ).toEqual([])
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

  it("exports the form schema selected by the owner", () => {
    const processorSchema = exportJSONSchemaForProjectFile({
      context,
      filePath: "Обработка/Загрузка/Формы/Основная/Форма.yaml",
      mode: "inline",
    })
    const catalogSchema = exportJSONSchemaForProjectFile({
      context,
      filePath:
        "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
      mode: "inline",
    })

    expect((processorSchema as { properties: object }).properties).toHaveProperty(
      "РасширенноеПредставление"
    )
    expect((catalogSchema as { properties: object }).properties).not.toHaveProperty(
      "РасширенноеПредставление"
    )

  })

  it("exports form schema graph without replacing element refs with any", () => {
    expect(JSON.stringify(formSchemaGraph.roots.form)).toContain("nkdk://schema/FormAttribute")
    expect(JSON.stringify(formSchemaGraph.schemas["nkdk://schema/FormAttribute"])).toContain('"Тип"')
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
    ).toThrow(/Ожидались Конфигурация\.yaml/)
  })

  it("rejects prefixed configuration YAML paths as unclassified", () => {
    const exportSchema = () =>
      exportJSONSchemaForProjectFile({
        context,
        filePath: "Архив/Конфигурация.yaml",
      })

    expect(exportSchema).toThrow(ProjectFileSchemaError)
    expect(exportSchema).toThrow(/Ожидались Конфигурация\.yaml/)
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
    const schema = requiredMapValue(compiledInlineSchemas, "Справочник/Товары/Свойства.yaml")

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
        text: ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n"),
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

  it.each([
    {
      label: "catalog attribute",
      filePath: "Справочник/Товары/Свойства.yaml",
      validText: ["Реквизиты:", "  Контрагент:", "    Тип: Справочник.Контрагенты"].join("\n"),
      invalidText: ["Реквизиты:", "  Контрагент:", "    Тип: СправочникСсылка.Контрагенты"].join("\n"),
    },
    {
      label: "document attribute",
      filePath: "Документ/Заказ/Свойства.yaml",
      validText: ["Реквизиты:", "  Контрагент:", "    Тип: Справочник.Контрагенты"].join("\n"),
      invalidText: ["Реквизиты:", "  Контрагент:", "    Тип: СправочникСсылка.Контрагенты"].join("\n"),
    },
    {
      label: "document tabular section attribute",
      filePath: "Документ/Заказ/Свойства.yaml",
      validText: [
        "ТабличныеЧасти:",
        "  Товары:",
        "    Реквизиты:",
        "      Номенклатура:",
        "        Тип: Справочник.Номенклатура",
      ].join("\n"),
      invalidText: [
        "ТабличныеЧасти:",
        "  Товары:",
        "    Реквизиты:",
        "      Номенклатура:",
        "        Тип: СправочникСсылка.Номенклатура",
      ].join("\n"),
    },
    {
      label: "chart of characteristic types attribute",
      filePath: "ПланВидовХарактеристик/ВидыСубконто/Свойства.yaml",
      validText: ["Реквизиты:", "  Контрагент:", "    Тип: Справочник.Контрагенты"].join("\n"),
      invalidText: ["Реквизиты:", "  Контрагент:", "    Тип: СправочникСсылка.Контрагенты"].join("\n"),
    },
    {
      label: "chart of characteristic types tabular section attribute",
      filePath: "ПланВидовХарактеристик/ВидыСубконто/Свойства.yaml",
      validText: [
        "ТабличныеЧасти:",
        "  Значения:",
        "    Реквизиты:",
        "      Номенклатура:",
        "        Тип: Справочник.Номенклатура",
      ].join("\n"),
      invalidText: [
        "ТабличныеЧасти:",
        "  Значения:",
        "    Реквизиты:",
        "      Номенклатура:",
        "        Тип: СправочникСсылка.Номенклатура",
      ].join("\n"),
    },
  ])("validates allowed TypeDescription values for $label", ({ filePath, validText, invalidText }) => {
    const schema = requiredMapValue(compiledInlineSchemas, filePath)

    expect(validateFile({ filePath, schema, text: validText })).toEqual([])
    expect(validateFile({ filePath, schema, text: invalidText })).not.toEqual([])
    expect(
      validateFile({
        filePath,
        schema,
        text: ["Реквизиты:", "  Неверный:", "    Тип: НесуществующийТип"].join("\n"),
      })
    ).not.toEqual([])
    expect(
      validateFile({
        filePath,
        schema,
        text: ["Реквизиты:", "  Таблица:", "    Тип:", "      - Строка", "      - ХранилищеЗначения"].join("\n"),
      })
    ).not.toEqual([])
    expect(
      validateFile({
        filePath,
        schema,
        text: [
          "Реквизиты:",
          "  Идентификатор:",
          "    Тип:",
          "      ИдентификаторТипа:",
          "        - 8c1e3694-da12-44d5-8b1f-d134b89a1282",
        ].join("\n"),
      })
    ).not.toEqual([])
  })
})

function propertySchema(schema: unknown, key: string): { description?: string } {
  const properties = (schema as { properties?: Record<string, unknown> }).properties
  const property = properties?.[key]
  if (typeof property !== "object" || property === null) {
    throw new Error(`Expected schema property "${key}"`)
  }

  return property as { description?: string }
}

describe("exportJSONSchemaForSchemaName", () => {
  it("exports schema by registered name", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "InputField" })

    expect(schema).toMatchObject({
      properties: expect.objectContaining({
        Вид: expect.objectContaining({ const: "ПолеВвода" }),
      }),
    })
  })

  it("keeps generic schema by type name free from concrete object-name restrictions", () => {
    expect(
      validateFile({
        filePath: "Свойства.yaml",
        schema: genericCatalogSchema,
        text: "Синоним: Какое то поле\n",
      })
    ).toEqual([])
  })

  it("reports unknown schema names", () => {
    expect(() => exportJSONSchemaForSchemaName({ context, name: "UnknownSchema" })).toThrow(
      /Неизвестная JSON Schema "UnknownSchema"/
    )
  })
})

function requiredMapValue<T>(map: ReadonlyMap<string, T>, key: string): T {
  const value = map.get(key)
  if (value === undefined) throw new Error(`Missing prepared schema for ${key}`)
  return value
}
