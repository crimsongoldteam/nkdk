import "../appliedObjects"
import "../forms"
import type { TSchema } from "typebox"
import Schema from "typebox/schema"
import { beforeEach, describe, expect, it } from "vitest"
import { MetadataConfigurationRules } from "../appliedObjects/configuration/rules"
import { MetadataLanguageRules } from "../appliedObjects/metadataLanguage/rules"
import { exportMetadataItemToJSONSchema } from "../orchestration/metadataItem/toJSONSchema"
import { clearJSONSchemaRefRegistries } from "../orchestration/jsonSchemaRefs"
import { ensureJSONSchemaRegistry, exportJSONSchemaForSchemaName, listJSONSchemaNames } from "./schemaRegistry"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

const schemaCache = new Map<string, TSchema>()

function schemaForName(name: string, mode?: "externalRefs" | "inline"): TSchema {
  const cacheKey = `${name}:${mode ?? "externalRefs"}`
  const cached = schemaCache.get(cacheKey)
  if (cached !== undefined) return cached

  const schema = exportJSONSchemaForSchemaName({ context, name, mode })
  schemaCache.set(cacheKey, schema)
  return schema
}

describe("JSON Schema registry", { timeout: 30_000 }, () => {
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

  it("accepts keyed predefined catalog items without explicit code", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "MetadataCatalog", mode: "inline" })
    const compiled = Schema.Compile(schema)

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
      const compiled = Schema.Compile(schema)

      expect(compiled.Check("Строка")).toBe(false)
      expect(compiled.Check({ Тип: "Строка" })).toBe(true)
      expect(JSON.stringify(schema)).toContain('"Тип"')
    }
  })

  it("accepts home page work area in configuration schemas", () => {
    const schema = exportMetadataItemToJSONSchema({ context, rule: MetadataConfigurationRules })
    const compiled = Schema.Compile(schema)

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

  it("allows opaque multiple-value DataPath only in InputField schema", () => {
    const inputFieldSchema = exportJSONSchemaForSchemaName({ context, name: "InputField" })
    const tableInputFieldSchema = exportJSONSchemaForSchemaName({ context, name: "TableInputField" })
    const opaquePath = "1/0:796f500f-c364-45d1-bce6-9e7e8e15b664"

    expect(Schema.Compile(inputFieldSchema).Check({ Вид: "ПолеВвода", ПутьКДанным: opaquePath })).toBe(true)
    expect(Schema.Compile(tableInputFieldSchema).Check({ Вид: "ПолеВвода", ПутьКДанным: opaquePath })).toBe(false)
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
    const schema = exportJSONSchemaForSchemaName({ context, name: "LabelDecoration" })
    const compiled = Schema.Compile(schema)

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

  it("exports form child item unions with Вид discriminantKey", () => {
    const schema = schemaForName("UsualGroup", "inline") as {
      properties?: {
        Элементы?: {
          $defs?: {
            GroupChildItems?: {
              patternProperties?: {
                "^.*$"?: {
                  anyOf?: Array<{ properties?: { Вид?: { const?: string } } }>
                  discriminantKey?: string
                }
              }
            }
          }
        }
      }
    }

    const childItemSchema = schema.properties?.Элементы?.$defs?.GroupChildItems?.patternProperties?.["^.*$"]

    expect(childItemSchema).toMatchObject({
      discriminantKey: "Вид",
    })
    expect(childItemSchema?.anyOf?.some((branch) => branch.properties?.Вид?.const === "Группа")).toBe(true)
    expect(childItemSchema?.anyOf?.some((branch) => branch.properties?.Вид?.const === "ПолеВвода")).toBe(true)
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
    const compiled = Schema.Compile(schema)
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

  it("restores property refs after generic ref registry is cleared", () => {
    clearJSONSchemaRefRegistries()
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
