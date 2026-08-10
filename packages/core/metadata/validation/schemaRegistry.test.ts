import { compileValidationSchema, type ValidationSchemaValidator } from "./compileValidationSchema"
import "../appliedObjects"
import "../forms"
import type { TSchema } from "typebox"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import { MetadataConfigurationRules } from "../appliedObjects/configuration/rules"
import { MetadataLanguageRules } from "../appliedObjects/metadataLanguage/rules"
import { exportMetadataItemToJSONSchema } from "../ruleRuntime/metadataItem/toJSONSchema"
import {
  ensureJSONSchemaRegistry,
  exportJSONSchemaForSchemaName,
  exportJSONSchemaGraph,
  listJSONSchemaNames,
} from "./schemaRegistry"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

const schemaCache = new Map<string, TSchema>()
const compiledSchemaCache = new Map<string, ValidationSchemaValidator>()
const graphCache = new Map<string, ReturnType<typeof exportJSONSchemaGraph>>()
let configurationSchema: ValidationSchemaValidator

function schemaForName(name: string, mode?: "externalRefs" | "inline"): TSchema {
  const cacheKey = `${name}:${mode ?? "externalRefs"}`
  const cached = schemaCache.get(cacheKey)
  if (cached !== undefined) return cached

  const schema = exportJSONSchemaForSchemaName({ context, name, mode })
  schemaCache.set(cacheKey, schema)
  return schema
}

function clientApplicationFormGraph(): ReturnType<typeof exportJSONSchemaGraph> {
  const cacheKey = "ClientApplicationForm:withNestedChildItems"
  const cached = graphCache.get(cacheKey)
  if (cached !== undefined) return cached

  const graph = exportJSONSchemaGraph({
    context,
    roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
  })
  graphCache.set(cacheKey, graph)
  return graph
}

function commonFormValidationGraph(): ReturnType<typeof exportJSONSchemaGraph> {
  const cacheKey = "MetadataCommonForm:validationPropertyRefs"
  const cached = graphCache.get(cacheKey)
  if (cached !== undefined) return cached

  const graph = exportJSONSchemaGraph({
    context,
    validationPropertyRefs: true,
    roots: [{ key: "commonForm", name: "MetadataCommonForm" }],
  })
  graphCache.set(cacheKey, graph)
  return graph
}

describe("JSON Schema registry", { timeout: 60_000 }, () => {
  beforeAll(() => {
    clientApplicationFormGraph()
    commonFormValidationGraph()
    for (const name of [
      "MetadataCatalog",
      "MetadataCatalogAttribute",
      "MetadataDocumentAttribute",
      "MetadataCatalogTabularSectionAttribute",
      "MetadataDataProcessorTabularSectionAttribute",
      "FormParameter",
      "CommandBarButton",
    ]) {
      compiledSchemaForName(
        name,
        ["MetadataCatalog", "FormParameter", "CommandBarButton"].includes(name) ? "inline" : undefined
      )
    }
    configurationSchema = compileValidationSchema(
      exportMetadataItemToJSONSchema({ context, rule: MetadataConfigurationRules })
    )
    configurationSchema.Check(undefined)
  }, 240_000)

  beforeEach(() => {
    ensureJSONSchemaRegistry()
  })

  it("exports compact named schemas by schema name", () => {
    const schema = schemaForName("MetadataCatalogAttribute")
    const json = JSON.stringify(schema)

    expect(json).toContain('"Тип"')
    expect(json).not.toContain("MetadataCatalog")
  })

  it("keeps catalog attribute collection refs precise", () => {
    const schema = schemaForName("MetadataCatalog")

    expect(JSON.stringify(schema)).toContain("nkdk://schema/MetadataCatalogAttribute")
  })

  it("resolves MetadataCatalogAttributes through collection registration", () => {
    const graph = exportJSONSchemaGraph({
      context,
      roots: [{ key: "catalog", name: "MetadataCatalog" }],
    })

    const catalog = graph.roots.catalog as { properties?: Record<string, unknown> }
    expect(catalog.properties?.Реквизиты).toMatchObject({
      type: "object",
      additionalProperties: { $ref: "nkdk://schema/MetadataCatalogAttribute" },
    })
    expect(catalog.properties?.ТабличныеЧасти).toMatchObject({
      type: "object",
      additionalProperties: { $ref: "nkdk://schema/MetadataCatalogTabularSection" },
    })
    expect(graph.schemas["nkdk://schema/MetadataCatalogAttribute"]).toMatchObject({
      $id: "nkdk://schema/MetadataCatalogAttribute",
      type: "object",
    })
    expect(graph.schemas["nkdk://schema/MetadataCatalogTabularSection"]).toMatchObject({
      $id: "nkdk://schema/MetadataCatalogTabularSection",
      type: "object",
      properties: expect.objectContaining({
        Реквизиты: expect.objectContaining({
          type: "object",
          additionalProperties: { $ref: "nkdk://schema/MetadataCatalogTabularSectionAttribute" },
        }),
      }),
    })
    expect(graph.schemas["nkdk://schema/MetadataCatalogTabularSectionAttribute"]).toMatchObject({
      $id: "nkdk://schema/MetadataCatalogTabularSectionAttribute",
      type: "object",
    })
  })

  it("accepts keyed predefined catalog items without explicit code", () => {
    expect(
      compiledSchemaForName("MetadataCatalog", "inline").Check({
        Предопределенные: {
          ПредопределенноеЗначение: {
            Наименование: "Предопределенное значение",
          },
        },
      })
    ).toBe(true)
  })

  it("exports object-only metadata attribute schemas", () => {
    const schemaNames = [
      "MetadataCatalogAttribute",
      "MetadataDocumentAttribute",
      "MetadataCatalogTabularSectionAttribute",
      "MetadataDataProcessorTabularSectionAttribute",
    ]

    for (const name of schemaNames) {
      const schema = schemaForName(name)
      const compiled = compiledSchemaForName(name)

      expect(compiled.Check("Строка")).toBe(false)
      expect(compiled.Check({ Тип: "Строка" })).toBe(true)
      expect(JSON.stringify(schema)).toContain('"Тип"')
    }
  })

  it.each([
    ["MetadataDataProcessorAttribute", { Тип: "Строка", ЗначениеЗаполнения: "Строка" }, "Fill"],
    ["MetadataDataProcessorTabularSectionAttribute", { Тип: "Строка", ИсторияДанных: "Использовать" }, "history"],
    ["MetadataDocumentAttribute", { Тип: "Строка", Использование: "ДляЭлемента" }, "Use"],
    ["MetadataDataProcessorTabularSection", { ДлинаНомераСтроки: 5 }, "LineNumberLength"],
    ["MetadataAccountingRegisterAttribute", { Тип: "Строка", ПолеИспользованияХраненияВХранилищеДвоичныхДанных: "Поле" }, "binary field"],
    ["MetadataInformationRegisterAttribute", { Тип: "Строка", СвязьСГрафиком: "График" }, "ScheduleLink"],
  ])("rejects unsupported %s field class: %s", (schemaName, yaml, _reason) => {
    expect(compiledSchemaForName(schemaName, "inline").Check(yaml)).toBe(false)
  })

  it("allows Fill fields only in specialized tabular section attributes", () => {
    const attribute = {
      Тип: "Строка",
      ЗаполнятьИзДанныхЗаполнения: "Истина",
      ЗначениеЗаполнения: "",
    }

    expect(compiledSchemaForName("MetadataDocumentTabularSectionAttribute").Check(attribute)).toBe(false)
    expect(compiledSchemaForName("MetadataDataProcessorTabularSectionAttribute").Check(attribute)).toBe(true)
  })

  it("accepts home page work area in configuration schemas", () => {
    expect(
      configurationSchema.Errors({
          Имя: "ТестоваяКонфигурация",
          ОсновнойЯзык: "Русский",
          РабочаяОбластьНачальнойСтраницы: {
            ШаблонРабочейОбласти: "ДвеКолонкиПеременнойШирины",
            ЛеваяКолонка: [
              {
                Форма: "CommonForm.РабочийСтол",
                Высота: 10,
                Видимость: {
                  Общее: "Истина",
                },
              },
              {
                Форма: "Task.ЗадачаИсполнителя.Form.МоиЗадачиДляРабочегоСтола",
                Высота: 10,
                Видимость: {
                  Общее: "Ложь",
                  Роли: {
                    НалоговыйМониторинг: "Истина",
                  },
                },
              },
            ],
            ПраваяКолонка: [
              {
                Форма: "DataProcessor.ИнформационныйЦентр.Form.ИнформационныйЦентр",
                Высота: 10,
                Видимость: {
                  Общее: "Ложь",
                },
              },
            ],
          },
        })[1].map((error) => `${error.instancePath}: ${error.message}`)
    ).toEqual([])
  })

  it("marks required YAML properties as JSON Schema required", () => {
    const schema = exportMetadataItemToJSONSchema({ context, rule: MetadataLanguageRules })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        КодЯзыка: expect.objectContaining({ type: "string" }),
      }),
      required: expect.arrayContaining(["КодЯзыка"]),
    })
  })

  it("exports form element schemas with Вид discriminator", () => {
    const schema = schemaForName("InputField")

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Вид: expect.objectContaining({ const: "ПолеВвода" }),
      }),
      required: expect.arrayContaining(["Вид"]),
    })
  })

  it("accepts native YAML boolean in form parameter key flag", () => {
    expect(compiledSchemaForName("FormParameter", "inline").Check({ Тип: "Строка", Ключевой: true })).toBe(true)
  })

  it("exports named schema graph with stable ids for referenced schemas", () => {
    const graph = clientApplicationFormGraph()

    expect(graph.roots.form).toMatchObject({
      type: "object",
      "x-nkdk-schemaRefs": expect.arrayContaining(["nkdk://schema/FormAttribute"]),
    })
    expect(graph.schemas["nkdk://schema/FormAttribute"]).toMatchObject({
      $id: "nkdk://schema/FormAttribute",
      type: "object",
      properties: expect.objectContaining({
        Колонки: expect.any(Object),
        ДополнительныеКолонки: expect.any(Object),
      }),
    })
    expect(graph.schemas["nkdk://schema/InputField"]).toMatchObject({
      $id: "nkdk://schema/InputField",
      properties: expect.objectContaining({
        Вид: expect.objectContaining({ const: "ПолеВвода" }),
      }),
    })
  })

  it("exports child item refs with AJV discriminator in form graph", () => {
    const graph = clientApplicationFormGraph()

    for (const owner of ["UsualGroup", "Page", "Table", "CommandBar", "ButtonGroup"] as const) {
      const schema = graph.schemas[`nkdk://schema/${owner}`] as
        | {
            properties?: {
              Элементы?: {
                additionalProperties?: {
                  discriminator?: { propertyName?: string }
                }
              }
            }
          }
        | undefined

      expect(schema?.properties?.Элементы?.additionalProperties?.discriminator).toEqual({ propertyName: "Вид" })
    }
  })

  it("exports appearance settings parameter values as refs in form graph", () => {
    const graph = clientApplicationFormGraph()
    const formAttributeJson = JSON.stringify(graph.schemas["nkdk://schema/FormAttribute"])
    const graphJson = JSON.stringify(graph)
    const visibilitySchemaName =
      "SettingsParameterValue/Primitive/yaml/%D0%92%D0%B8%D0%B4%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D1%8C"

    expect(graphJson).toContain(`nkdk://schema/${visibilitySchemaName}`)
    expect(formAttributeJson).not.toContain(`${visibilitySchemaName}/$defs`)
    expect(graph.schemas[`nkdk://schema/${visibilitySchemaName}`]).toMatchObject({
      $id: `nkdk://schema/${visibilitySchemaName}`,
    })
  })

  it("exports single form objects as refs in form graph", () => {
    const graph = clientApplicationFormGraph()
    const tableSchema = graph.schemas["nkdk://schema/Table"] as {
      properties?: {
        КонтекстноеМеню?: { $ref?: string }
      }
    }
    const tableJson = JSON.stringify(tableSchema)

    expect(tableJson).toContain("nkdk://schema/ContextMenu")
    expect(tableJson).toContain("nkdk://schema/ExtendedTooltip")
    expect(tableJson).toContain("nkdk://schema/SingleSearchControlAddition")
    expect(tableJson).toContain("nkdk://schema/SingleSearchStringAddition")
    expect(tableJson).toContain("nkdk://schema/SingleViewStatusAddition")
    expect(tableSchema.properties?.КонтекстноеМеню).toMatchObject({ $ref: "nkdk://schema/ContextMenu" })
    expect(graph.schemas["nkdk://schema/ContextMenu"]).toMatchObject({
      $id: "nkdk://schema/ContextMenu",
      properties: expect.objectContaining({
        Элементы: expect.any(Object),
      }),
    })
    expect(graph.schemas["nkdk://schema/AutoCommandBar"]).toMatchObject({
      $id: "nkdk://schema/AutoCommandBar",
      properties: expect.objectContaining({
        Элементы: expect.any(Object),
      }),
    })
    expect(tableJson).not.toContain('"РасширеннаяПодсказка":{"type":"object"')
    expect(graph.schemas["nkdk://schema/ExtendedTooltip"]).toMatchObject({ $id: "nkdk://schema/ExtendedTooltip" })
    expect(graph.schemas["nkdk://schema/SingleSearchControlAddition"]).toMatchObject({
      $id: "nkdk://schema/SingleSearchControlAddition",
    })
    expect(graph.schemas["nkdk://schema/SingleSearchStringAddition"]).toMatchObject({
      $id: "nkdk://schema/SingleSearchStringAddition",
    })
    expect(graph.schemas["nkdk://schema/SingleViewStatusAddition"]).toMatchObject({
      $id: "nkdk://schema/SingleViewStatusAddition",
    })
  })

  it("keeps registered form subgraphs reachable from the form graph", () => {
    const graphJSON = JSON.stringify(clientApplicationFormGraph())
    const expectedProperties = [
      "ТаблицаФормы",
      "КоманднаяПанель",
      "Автозаполнение",
      "ОтображениеСтрокиПоиска",
      "УправлениеПоиском",
      "Источник",
      "ОтображениеСостоянияПросмотра",
      "УсловноеОформление",
      "УсловноеОформлениеРеквизитов",
      "ЦветТекста",
      "Формат",
      "Поля",
      "Порядок",
      "Отбор",
      "ПараметрыДанных",
      "ЛевоеЗначение",
      "ПравоеЗначение",
      "ТипГруппы",
      "ПроизвольныйЗапрос",
    ]

    expect(expectedProperties.filter((property) => !graphJSON.includes(`"${property}"`))).toEqual([])
  })

  it("exports common form form body as a ClientApplicationForm ref", () => {
    const schema = schemaForName("MetadataCommonForm") as {
      properties?: {
        Форма?: { $ref?: string }
      }
    }

    expect(schema.properties?.Форма).toMatchObject({ $ref: "nkdk://schema/ClientApplicationForm" })
    expect(JSON.stringify(schema)).toContain('"x-nkdk-schemaRefs":["nkdk://schema/ClientApplicationForm"')
  })

  it("uses validation refs only for reusable schemas", () => {
    const graph = commonFormValidationGraph()
    const prefix = "nkdk://schema/validation/2.20/ru/"
    const commonForm = graph.roots.commonForm as { properties?: { Форма?: { $ref?: string } } }
    const clientForm = graph.schemas[`${prefix}ClientApplicationForm`] as {
      properties?: { События?: { $ref?: string } }
    }
    const inputField = graph.schemas[`${prefix}InputField`] as {
      properties?: {
        Высота?: { $ref?: string }
        Маска?: { $ref?: string }
        ПутьКДанным?: { $ref?: string }
      }
    }
    const visibilitySchemaName =
      "SettingsParameterValue/Primitive/yaml/%D0%92%D0%B8%D0%B4%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D1%8C"

    expect(commonForm.properties?.Форма).toMatchObject({ $ref: `${prefix}ClientApplicationForm` })
    expect(graph.schemas[`${prefix}${visibilitySchemaName}`]).toMatchObject({ $id: `${prefix}${visibilitySchemaName}` })
    expect(graph.schemas[`${prefix}DcsMetadataValue/Primitive`]).toMatchObject({
      $id: `${prefix}DcsMetadataValue/Primitive`,
    })
    expect(graph.schemas[`${prefix}DcsExplicitSystemEnumerationValue`]).toEqual({
      $id: `${prefix}DcsExplicitSystemEnumerationValue`,
    })
    expect(inputField.properties?.Высота).toMatchObject({ $ref: `${prefix}number/without-0` })
    expect(inputField.properties?.Маска).toMatchObject({ $ref: `${prefix}string/base` })
    expect(graph.schemas[`${prefix}number/without-0`]).toMatchObject({ $id: `${prefix}number/without-0` })
    expect(graph.schemas[`${prefix}string/base`]).toMatchObject({ $id: `${prefix}string/base` })
    expect(clientForm.properties?.События?.$ref).toBeUndefined()
    expect(inputField.properties?.ПутьКДанным?.$ref).toBeUndefined()
  })

  it("exports reusable form property types as validation refs by default", () => {
    const graph = commonFormValidationGraph()
    const prefix = "nkdk://schema/validation/2.20/ru/"
    const inputField = graph.schemas[`${prefix}InputField`] as {
      properties?: Record<string, { $ref?: string }>
    }

    expect(inputField.properties?.ЦветФона).toMatchObject({ $ref: `${prefix}Color/base` })
    expect(inputField.properties?.ЦветТекста).toMatchObject({ $ref: `${prefix}Color/base` })
    expect(inputField.properties?.Шрифт).toMatchObject({ $ref: `${prefix}Font/base` })
    expect(inputField.properties?.КартинкаКнопкиВыбора).toMatchObject({ $ref: `${prefix}Picture/base` })
    expect(inputField.properties?.Заголовок).toMatchObject({ $ref: `${prefix}I8nText/base` })
    expect(inputField.properties?.Использование).toMatchObject({ $ref: `${prefix}UserVisible/base` })
    expect(inputField.properties?.СписокВыбора).toMatchObject({ $ref: `${prefix}ChoiceList/base` })

    expect(graph.schemas[`${prefix}Color/base`]).toMatchObject({ $id: `${prefix}Color/base` })
    expect(graph.schemas[`${prefix}Font/base`]).toMatchObject({ $id: `${prefix}Font/base` })
    expect(graph.schemas[`${prefix}Picture/base`]).toMatchObject({ $id: `${prefix}Picture/base` })
    expect(graph.schemas[`${prefix}I8nText/base`]).toMatchObject({ $id: `${prefix}I8nText/base` })
  })

  it("keeps DataPath and Events inline in validation schemas", () => {
    const graph = commonFormValidationGraph()
    const prefix = "nkdk://schema/validation/2.20/ru/"
    const clientForm = graph.schemas[`${prefix}ClientApplicationForm`] as {
      properties?: { События?: { $ref?: string } }
    }
    const inputField = graph.schemas[`${prefix}InputField`] as {
      properties?: { ПутьКДанным?: { $ref?: string } }
    }

    expect(clientForm.properties?.События?.$ref).toBeUndefined()
    expect(inputField.properties?.ПутьКДанным?.$ref).toBeUndefined()
    expect(JSON.stringify(inputField.properties?.ПутьКДанным)).toContain("type")
    expect(JSON.stringify(inputField.properties?.ПутьКДанным)).toContain('"const":""')
    expect(JSON.stringify(clientForm.properties?.События)).toContain("properties")
  })

  it("does not leave large reusable property schemas inline in InputField validation schema", () => {
    const graph = commonFormValidationGraph()
    const prefix = "nkdk://schema/validation/2.20/ru/"
    const inputField = graph.schemas[`${prefix}InputField`] as {
      properties?: Record<string, unknown>
    }
    const inputFieldJson = JSON.stringify(inputField)

    expect(inputFieldJson).not.toContain("ЦветФонаПодсказки")
    expect(inputFieldJson).not.toContain("ШрифтТекста")
    expect(inputField.properties?.ЦветФона).toMatchObject({ $ref: `${prefix}Color/base` })
    expect(inputField.properties?.Шрифт).toMatchObject({ $ref: `${prefix}Font/base` })
  })

  it("keeps tree YAML button type alias away from Вид discriminator", () => {
    const schema = schemaForName("Button")

    expect(schema).toMatchObject({
      properties: expect.objectContaining({
        Вид: expect.objectContaining({ const: "Кнопка" }),
        ТипКнопки: expect.any(Object),
      }),
    })
  })

  it("exports nested child items as refs by default", () => {
    const schema = schemaForName("UsualGroup")
    const json = JSON.stringify(schema)

    expect(json).toContain("nkdk://schema/InputField")
    expect(json).not.toContain('"ПутьКДанным"')
  })

  it("accepts command names in command bar button schemas", () => {
    const value = {
      Вид: "КнопкаКоманднойПанели",
      ИмяКоманды: "Form.Command.ВыбратьСтроки",
      ТипКнопки: "КнопкаКоманднойПанели",
    }

    expect(
      compiledSchemaForName("CommandBarButton", "inline")
        .Errors(value)[1]
        .map((error) => `${error.instancePath}: ${error.message}`)
    ).toEqual([])
  })

  it("exports registered property refs through project schema registry", () => {
    const schema = schemaForName("UsualGroup")

    expect(JSON.stringify(schema)).toContain("nkdk://schema/InputField")
  })

  it("reports unknown schema names", () => {
    expect(() => exportJSONSchemaForSchemaName({ context, name: "UnknownSchema" })).toThrow(
      /Неизвестная JSON Schema "UnknownSchema"/
    )
  })

  it("lists known schema names", () => {
    expect(listJSONSchemaNames()).toEqual(
      expect.arrayContaining(["MetadataCatalogAttribute", "MetadataDocumentAttribute", "InputField", "Table"])
    )
  })
})

function compiledSchemaForName(name: string, mode?: "externalRefs" | "inline"): ValidationSchemaValidator {
  const cacheKey = `${name}:${mode ?? "externalRefs"}`
  const cached = compiledSchemaCache.get(cacheKey)
  if (cached !== undefined) return cached

  const compiled = compileValidationSchema(schemaForName(name, mode), { eagerFallback: true })
  compiled.Check(undefined)
  compiledSchemaCache.set(cacheKey, compiled)
  return compiled
}
