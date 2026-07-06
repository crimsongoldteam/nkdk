import { compileValidationSchema } from "./compileValidationSchema"
import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, describe, expect, it } from "vitest"
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

  it("describes equal-name exclusion without making the schema name-dependent", () => {
    const schema = exportJSONSchemaForProjectFile({
      context,
      filePath: "Справочник/КакоеТоПоле/Свойства.yaml",
      mode: "inline",
    })
    const synonymSchema = propertySchema(schema, "Синоним")

    expect(synonymSchema.description).toBe(EXCLUDE_IF_EQUAL_NAME_YAML_DESCRIPTION)
    expect(JSON.stringify(synonymSchema)).not.toContain("Какое то поле")
    expect(JSON.stringify(synonymSchema)).not.toContain('"not"')

    const compiled = compileValidationSchema(schema)
    expect(
      validateFile({
        filePath: "Справочник/КакоеТоПоле/Свойства.yaml",
        schema: compiled,
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

  it("exports form schema graph without replacing element refs with any", () => {
    const graph = exportJSONSchemaGraph({
      context,
      roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
    })

    expect(JSON.stringify(graph.roots.form)).toContain("nkdk://schema/FormAttribute")
    expect(JSON.stringify(graph.schemas["nkdk://schema/FormAttribute"])).toContain('"Тип"')
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
    const schema = compileValidationSchema(
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
    const schema = compileValidationSchema(
      exportJSONSchemaForProjectFile({
        context,
        filePath,
        mode: "inline",
      })
    )

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
    const schema = compileValidationSchema(
      exportJSONSchemaForSchemaName({
        context,
        name: "MetadataCatalog",
        mode: "inline",
      })
    )

    expect(
      validateFile({
        filePath: "Свойства.yaml",
        schema,
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
