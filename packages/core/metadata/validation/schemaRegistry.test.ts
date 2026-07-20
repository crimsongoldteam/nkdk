import { compileValidationSchema, type ValidationSchemaValidator } from "./compileValidationSchema"
import "../appliedObjects"
import "../forms"
import type { TSchema } from "typebox"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import { MetadataConfigurationRules } from "../appliedObjects/configuration/rules"
import { MetadataLanguageRules } from "../appliedObjects/metadataLanguage/rules"
import { exportMetadataItemToJSONSchema } from "../orchestration/metadataItem/toJSONSchema"
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
const compiledSchemaCache = new Map<string, ValidationSchemaValidator<TSchema>>()

function schemaForName(name: string, mode?: "externalRefs" | "inline"): TSchema {
  const cacheKey = `${name}:${mode ?? "externalRefs"}`
  const cached = schemaCache.get(cacheKey)
  if (cached !== undefined) return cached

  const schema = exportJSONSchemaForSchemaName({ context, name, mode })
  schemaCache.set(cacheKey, schema)
  return schema
}

describe("JSON Schema registry", { timeout: 60_000 }, () => {
  beforeAll(() => {
    compiledSchemaForName("InputField", "inline")
    compiledSchemaForName("TableInputField", "inline")
  }, 30_000)

  beforeEach(() => {
    ensureJSONSchemaRegistry()
  })

  it("exports compact named schemas by schema name", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "MetadataAttribute" })
    const json = JSON.stringify(schema)

    expect(json).toContain('"Тип"')
    expect(json).not.toContain("MetadataCatalog")
  })

  it("keeps catalog attribute collection refs precise", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "MetadataCatalog" })

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
    expect(graph.schemas["nkdk://schema/MetadataCatalogAttribute"]).toMatchObject({
      $id: "nkdk://schema/MetadataCatalogAttribute",
      type: "object",
    })
  })

  it("accepts keyed predefined catalog items without explicit code", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "MetadataCatalog", mode: "inline" })
    const compiled = compileValidationSchema(schema)

    expect(
      compiled.Check({
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
      "MetadataAttribute",
      "MetadataCatalogAttribute",
      "MetadataDocumentAttribute",
      "MetadataTabularSectionAttribute",
    ]

    for (const name of schemaNames) {
      const schema = exportJSONSchemaForSchemaName({ context, name })
      const compiled = compileValidationSchema(schema)

      expect(compiled.Check("Строка")).toBe(false)
      expect(compiled.Check({ Тип: "Строка" })).toBe(true)
      expect(JSON.stringify(schema)).toContain('"Тип"')
    }
  })

  it("accepts home page work area in configuration schemas", () => {
    const schema = exportMetadataItemToJSONSchema({ context, rule: MetadataConfigurationRules })
    const compiled = compileValidationSchema(schema)

    expect(
      compiled.Errors({
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
    const schema = exportJSONSchemaForSchemaName({ context, name: "InputField" })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Вид: expect.objectContaining({ const: "ПолеВвода" }),
      }),
      required: expect.arrayContaining(["Вид"]),
    })
  })

  it("accepts native YAML boolean in form parameter key flag", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "FormParameter", mode: "inline" })
    const compiled = compileValidationSchema(schema)

    expect(compiled.Check({ Тип: "Строка", Ключевой: true })).toBe(true)
  })

  it("exports named schema graph with stable ids for referenced schemas", () => {
    const graph = exportJSONSchemaGraph({
      context,
      roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
    })

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
    const graph = exportJSONSchemaGraph({
      context,
      roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
    })

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
    const graph = exportJSONSchemaGraph({
      context,
      roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
    })
    const formAttributeJson = JSON.stringify(graph.schemas["nkdk://schema/FormAttribute"])
    const graphJson = JSON.stringify(graph)
    const visibilitySchemaName = "AppearanceSettingsParameterValue_Primitive__u0412_u0438_u0434_u0438_u043c_u043e_u0441_u0442_u044c"

    expect(graphJson).toContain(`nkdk://schema/${visibilitySchemaName}`)
    expect(formAttributeJson).not.toContain("SettingsParameterValue_Primitive_Видимость/$defs")
    expect(graph.schemas[`nkdk://schema/${visibilitySchemaName}`]).toMatchObject({
      $id: `nkdk://schema/${visibilitySchemaName}`,
    })
  })

  it("accepts dynamic list auto order marker in form graph", () => {
    const graph = exportJSONSchemaGraph({
      context,
      roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
    })
    const compiled = compileValidationSchema(graph.schemas, graph.roots.form!, {
      inlineRefs: false,
      eagerFallback: true,
    })

    expect(
      compiled.Check({
        Реквизиты: {
          Список: {
            Тип: "ДинамическийСписок",
            ДинамическийСписок: {
              Порядок: {
                Элементы: [{ Поле: "НалоговыйПериод" }, "[Авто]"],
              },
            },
          },
        },
      })
    ).toBe(true)
  })

  it("exports single form objects as refs in form graph", () => {
    const graph = exportJSONSchemaGraph({
      context,
      roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
    })
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

  it("exports common form form body as a ClientApplicationForm ref", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "MetadataCommonForm" }) as {
      properties?: {
        Форма?: { $ref?: string }
      }
    }

    expect(schema.properties?.Форма).toMatchObject({ $ref: "nkdk://schema/ClientApplicationForm" })
    expect(JSON.stringify(schema)).toContain('"x-nkdk-schemaRefs":["nkdk://schema/ClientApplicationForm"')
  })

  it("allows opaque multiple-value DataPath in InputField schema", () => {
    const opaquePath = "1/0:796f500f-c364-45d1-bce6-9e7e8e15b664"

    expect(compiledSchemaForName("InputField", "inline").Check({ Вид: "ПолеВвода", ПутьКДанным: opaquePath })).toBe(
      true
    )
  })

  it("rejects opaque multiple-value DataPath in TableInputField schema", () => {
    const opaquePath = "1/0:796f500f-c364-45d1-bce6-9e7e8e15b664"

    expect(
      compiledSchemaForName("TableInputField", "inline").Check({ Вид: "ПолеВвода", ПутьКДанным: opaquePath })
    ).toBe(false)
  })

  it("keeps tree YAML button type alias away from Вид discriminator", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "Button" })

    expect(schema).toMatchObject({
      properties: expect.objectContaining({
        Вид: expect.objectContaining({ const: "Кнопка" }),
        ТипКнопки: expect.any(Object),
      }),
    })
  })

  it("accepts value-based formatted title in label decoration schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "LabelDecoration", mode: "inline" })
    const compiled = compileValidationSchema(schema)

    expect(
      compiled.Check({
        Вид: "Надпись",
        Заголовок: {
          Форматированный: "Истина",
          Текст: "<b>Заголовок</>",
        },
      })
    ).toBe(true)
  })

  it("exports nested child items as refs by default", () => {
    const schema = schemaForName("UsualGroup")
    const json = JSON.stringify(schema)

    expect(json).toContain("nkdk://schema/InputField")
    expect(json).not.toContain('"ПутьКДанным"')
  })

  it("exports nested child items inline in inline mode", () => {
    const schema = schemaForName("UsualGroup", "inline")
    const json = JSON.stringify(schema)

    expect(json).not.toContain("nkdk://schema/InputField")
    expect(json).toContain('"Элементы"')
    expect(json).toContain('"ПутьКДанным"')
  })

  it("exports form child item unions with AJV Вид discriminator", () => {
    const schema = schemaForName("UsualGroup", "inline") as {
      properties?: {
        Элементы?: {
          $defs?: {
            GroupChildItems?: {
              patternProperties?: {
                "^.*$"?: {
                  oneOf?: Array<{ properties?: { Вид?: { const?: string } } }>
                  discriminator?: { propertyName?: string }
                }
              }
            }
          }
        }
      }
    }

    const childItemSchema = schema.properties?.Элементы?.$defs?.GroupChildItems?.patternProperties?.["^.*$"]

    expect(childItemSchema).toMatchObject({
      discriminator: { propertyName: "Вид" },
    })
    expect(childItemSchema?.oneOf?.some((branch) => branch.properties?.Вид?.const === "Группа")).toBe(true)
    expect(childItemSchema?.oneOf?.some((branch) => branch.properties?.Вид?.const === "ПолеВвода")).toBe(true)
  })

  it("exports value-based UserVisible in form element schemas", () => {
    const schema = schemaForName("UsualGroup", "inline")
    const json = JSON.stringify(schema)
    const legacyAllow = "Разрешить" + "Использование"
    const legacyDeny = "Запретить" + "Использование"

    expect(json).toContain('"Использование"')
    expect(json).not.toContain(legacyAllow)
    expect(json).not.toContain(legacyDeny)
  })

  it("exports nested child items in inline form element schemas", () => {
    const schema = schemaForName("UsualGroup", "inline")
    const json = JSON.stringify(schema)

    expect(json).toContain('"Элементы"')
    expect(json).toContain('"ПолеВвода"')
  })

  it("exports table command bar fields in inline client form schemas", () => {
    const schema = schemaForName("ClientApplicationForm", "inline")
    const json = JSON.stringify(schema)

    expect(json).toContain('"ТаблицаФормы"')
    expect(json).toContain('"КоманднаяПанель"')
    expect(json).toContain('"Автозаполнение"')
  })

  it("exports command bar search additions with source fields", () => {
    const schema = schemaForName("ClientApplicationForm", "inline")
    const json = JSON.stringify(schema)

    expect(json).toContain('"ОтображениеСтрокиПоиска"')
    expect(json).toContain('"УправлениеПоиском"')
    expect(json).toContain('"Источник"')
  })

  it("accepts command names in command bar button schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "CommandBarButton", mode: "inline" })
    const compiled = compileValidationSchema(schema)
    const value = {
      Вид: "КнопкаКоманднойПанели",
      ИмяКоманды: "Form.Command.ВыбратьСтроки",
      ТипКнопки: "КнопкаКоманднойПанели",
    }

    expect(compiled.Errors(value)[1].map((error) => `${error.instancePath}: ${error.message}`)).toEqual([])
  })

  it("exports view status source in inline client form schemas", () => {
    const schema = schemaForName("ClientApplicationForm", "inline")
    const json = JSON.stringify(schema)

    expect(json).toContain('"ОтображениеСостоянияПросмотра"')
    expect(json).toContain('"Источник"')
  })

  it("exports dynamic list conditional appearance in inline client form schemas", () => {
    const schema = schemaForName("ClientApplicationForm", "inline")

    expect(JSON.stringify(schema)).toContain('"УсловноеОформление"')
  })

  it("exports appearance SettingsParameterValue fields in inline client form schemas", () => {
    const schema = schemaForName("ClientApplicationForm", "inline")
    const json = JSON.stringify(schema)

    expect(json).toContain('"УсловноеОформлениеРеквизитов"')
    expect(json).toContain('"ЦветТекста"')
    expect(json).toContain('"Формат"')
  })

  it("exports dynamic list DCS arrays in inline client form schemas", () => {
    const schema = schemaForName("ClientApplicationForm", "inline")
    const json = JSON.stringify(schema)

    expect(json).toContain('"Поля"')
    expect(json).toContain('"Порядок"')
    expect(json).toContain('"Отбор"')
    expect(json).toContain('"ПараметрыДанных"')
  })

  it("exports DCS conditional appearance values generated from all fixtures", () => {
    const schema = schemaForName("ClientApplicationForm", "inline")
    const json = JSON.stringify(schema)

    expect(json).toContain('"ЛевоеЗначение"')
    expect(json).toContain('"ПравоеЗначение"')
    expect(json).toContain('"ТипГруппы"')
  })

  it("exports ManualQuery literal in inline client form schemas", () => {
    const schema = schemaForName("ClientApplicationForm", "inline")
    const json = JSON.stringify(schema)

    expect(json).toContain('"ПроизвольныйЗапрос"')
    expect(json).toContain('"Истина"')
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
      expect.arrayContaining(["MetadataAttribute", "MetadataCatalogAttribute", "InputField", "Table"])
    )
  })
})

function compiledSchemaForName(name: string, mode?: "externalRefs" | "inline"): ValidationSchemaValidator<TSchema> {
  const cacheKey = `${name}:${mode ?? "externalRefs"}`
  const cached = compiledSchemaCache.get(cacheKey)
  if (cached !== undefined) return cached

  const compiled = compileValidationSchema(schemaForName(name, mode))
  compiledSchemaCache.set(cacheKey, compiled)
  return compiled
}
