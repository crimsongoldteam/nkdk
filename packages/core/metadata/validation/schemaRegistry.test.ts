import "~/metadata/appliedObjects"
import "~/metadata/forms"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { MetadataConfigurationRules } from "~/metadata/appliedObjects/configuration/rules"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { clearJSONSchemaRefRegistries } from "~/metadata/orchestration/jsonSchemaRefs"
import { exportJSONSchemaForSchemaName, listJSONSchemaNames } from "~/metadata/validation/schemaRegistry"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("JSON Schema registry", () => {
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

  it("exports object-only metadata attribute schemas", () => {
    const schemaNames = [
      "MetadataAttribute",
      "MetadataCatalogAttribute",
      "MetadataDocumentAttribute",
      "MetadataTabularSectionAttribute",
    ]

    for (const name of schemaNames) {
      const schema = exportJSONSchemaForSchemaName({ context, name })
      const compiled = TypeCompiler.Compile(schema)

      expect(compiled.Check("Строка")).toBe(false)
      expect(compiled.Check({ Тип: "Строка" })).toBe(true)
      expect(JSON.stringify(schema)).toContain('"Тип"')
    }
  })

  it("accepts home page work area in configuration schemas", () => {
    const schema = exportMetadataItemToJSONSchema({ context, rule: MetadataConfigurationRules })
    const compiled = TypeCompiler.Compile(schema)

    expect(
      compiled.Check({
        Имя: "Конфигурация",
        РабочаяОбластьНачальнойСтраницы: {
          ШаблонРабочейОбласти: "ДвеКолонкиПеременнойШирины",
          ЛеваяКолонка: [
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
      })
    ).toBe(true)
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

    expect(TypeCompiler.Compile(inputFieldSchema).Check({ Вид: "ПолеВвода", ПутьКДанным: opaquePath })).toBe(true)
    expect(TypeCompiler.Compile(tableInputFieldSchema).Check({ Вид: "ПолеВвода", ПутьКДанным: opaquePath })).toBe(false)
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
    const compiled = TypeCompiler.Compile(schema)

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
    const schema = exportJSONSchemaForSchemaName({ context, name: "UsualGroup" })
    const json = JSON.stringify(schema)

    expect(json).toContain("nkdk://schema/InputField")
    expect(json).not.toContain('"ПутьКДанным"')
  })

  it("exports nested child items inline in inline mode", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "UsualGroup", mode: "inline" })
    const json = JSON.stringify(schema)

    expect(json).not.toContain("nkdk://schema/InputField")
    expect(json).toContain('"Элементы"')
    expect(json).toContain('"ПутьКДанным"')
  })

  it("exports form child item unions with Вид discriminantKey", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "UsualGroup", mode: "inline" }) as {
      properties?: {
        Элементы?: {
          $defs?: {
            GroupChildItems?: {
              patternProperties?: {
                "^(.*)$"?: {
                  anyOf?: Array<{ properties?: { Вид?: { const?: string } } }>
                  discriminantKey?: string
                }
              }
            }
          }
        }
      }
    }

    const childItemSchema = schema.properties?.Элементы?.$defs?.GroupChildItems?.patternProperties?.["^(.*)$"]

    expect(childItemSchema).toMatchObject({
      discriminantKey: "Вид",
    })
    expect(childItemSchema?.anyOf?.some((branch) => branch.properties?.Вид?.const === "Группа")).toBe(true)
    expect(childItemSchema?.anyOf?.some((branch) => branch.properties?.Вид?.const === "ПолеВвода")).toBe(true)
  })

  it("compiles inline child item schemas with TypeBox compiler", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "UsualGroup", mode: "inline" })

    expect(() => TypeCompiler.Compile(schema)).not.toThrow()
  })

  it("accepts only value-based UserVisible in form element schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "UsualGroup", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const legacyAllow = "Разрешить" + "Использование"
    const legacyDeny = "Запретить" + "Использование"

    expect(
      compiled.Check({
        Вид: "Группа",
        Использование: {
          Роли: { "Role.Администратор": "Ложь" },
        },
      })
    ).toBe(true)

    expect(
      compiled.Check({
        Вид: "Группа",
        [legacyAllow]: { "Role.Администратор": "Ложь" },
      })
    ).toBe(false)

    expect(
      compiled.Check({
        Вид: "Группа",
        [legacyDeny]: { "Role.Администратор": "Истина" },
      })
    ).toBe(false)
  })

  it("accepts nested child items in inline form element schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "UsualGroup", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Вид: "Группа",
      Элементы: {
        Группа: {
          Вид: "Группа",
          Элементы: {
            Поле: {
              Вид: "ПолеВвода",
            },
          },
        },
      },
    }

    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toEqual([])
  })

  it("accepts table auto command bar in inline client form schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Элементы: {
        Таблица: {
          Вид: "ТаблицаФормы",
          КоманднаяПанель: {
            Автозаполнение: "Ложь",
            ГоризонтальноеПоложение: "Лево",
          },
          Элементы: {
            Колонка: {
              Вид: "ПолеВвода",
            },
          },
        },
      },
    }

    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toEqual([])
  })

  it("reports selected branch errors for command bar search string additions", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Элементы: {
        Таблица: {
          Вид: "ТаблицаФормы",
          КоманднаяПанель: {
            Элементы: {
              СтрокаПоиска: {
                Вид: "ОтображениеСтрокиПоиска",
                Источник: "Таблица",
                Заголовок: {
                  ru: "Строка поиска",
                },
              },
            },
          },
        },
      },
    }

    expect(compiled.Check(value)).toBe(false)
    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toContain(
      "/Элементы/Таблица: Expected union value"
    )
  })

  it("rejects source in command bar search string additions", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Элементы: {
        Таблица: {
          Вид: "ТаблицаФормы",
          КоманднаяПанель: {
            Элементы: {
              СтрокаПоиска: {
                Вид: "ОтображениеСтрокиПоиска",
                Источник: "Таблица",
              },
            },
          },
        },
      },
    }

    expect(compiled.Check(value)).toBe(false)
    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toContain(
      "/Элементы/Таблица: Expected union value"
    )
  })

  it("rejects source in command bar search control additions", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Элементы: {
        Таблица: {
          Вид: "ТаблицаФормы",
          КоманднаяПанель: {
            Элементы: {
              УправлениеПоиском: {
                Вид: "УправлениеПоиском",
                Источник: "Таблица",
              },
            },
          },
        },
      },
    }

    expect(compiled.Check(value)).toBe(false)
    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toContain(
      "/Элементы/Таблица: Expected union value"
    )
  })

  it("accepts command names in command bar button schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "CommandBarButton", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Вид: "КнопкаКоманднойПанели",
      ИмяКоманды: "Form.Command.ВыбратьСтроки",
      ТипКнопки: "КнопкаКоманднойПанели",
    }

    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toEqual([])
  })

  it("exports dynamic list conditional appearance in inline client form schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })

    expect(JSON.stringify(schema)).toContain('"УсловноеОформление"')
  })

  it("accepts dynamic list conditional appearance in inline client form schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Реквизиты: {
        Список: {
          Тип: "ДинамическийСписок",
          ОсновнойРеквизит: "Истина",
          ДинамическийСписок: {
            УсловноеОформление: {
              РежимОтображения: "Обычный",
              ИспользоватьПользовательскуюНастройку: "Истина",
              ПредставлениеПользовательскойНастройки: {
                ru: "Условное оформление",
              },
            },
            ДинамическоеСчитываниеДанных: "Истина",
          },
        },
      },
      Элементы: {
        Список: {
          Вид: "ТаблицаФормы",
          ПутьКДанным: "Список",
        },
      },
    }

    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toEqual([])
  })

  it("accepts appearance SettingsParameterValue fields in inline client form schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      УсловноеОформлениеРеквизитов: {
        Элементы: [
          {
            Оформление: {
              ЦветТекста: "ЭлементСтиля.ТекстЗапрещеннойЯчейкиЦвет",
              ЦветФона: "ЦветФонаПодсказки",
              Шрифт: {
                Вид: "ШрифтТекста",
              },
              ГоризонтальноеПоложение: "Лево",
              Формат: '"ЧДЦ=1"',
              Видимость: "Ложь",
            },
          },
        ],
      },
    }

    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toEqual([])
  })

  it("accepts dynamic list DCS arrays in inline client form schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Реквизиты: {
        Список: {
          Тип: "ДинамическийСписок",
          ОсновнойРеквизит: "Истина",
          ДинамическийСписок: {
            ПроизвольныйЗапрос: "Истина",
            ДинамическоеСчитываниеДанных: "Истина",
            Поля: [
              {
                Вид: "ПолеНабораДанныхСхемыКомпоновкиДанных",
                ПутьКДанным: "КоличествоДокументов",
                Поле: "КоличествоДокументов",
              },
            ],
            Порядок: {
              Элементы: [{ Поле: "ДатаВходящегоДокумента" }],
            },
            Отбор: {
              Элементы: [{ ЛевоеЗначение: ".ХозяйственнаяОперация", Использование: "Ложь" }],
            },
          },
        },
      },
    }

    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toEqual([])
  })

  it("rejects ManualQuery false in inline client form schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Реквизиты: {
        Список: {
          Тип: "ДинамическийСписок",
          ОсновнойРеквизит: "Истина",
          ДинамическийСписок: {
            ПроизвольныйЗапрос: "Ложь",
            ДинамическоеСчитываниеДанных: "Истина",
            ОсновнаяТаблица: "Catalog.РеестрПартийЗЕРНО",
          },
        },
      },
    }

    expect(compiled.Check(value)).toBe(false)
    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toContain(
      "/Реквизиты/Список/ДинамическийСписок/ПроизвольныйЗапрос: Expected 'Истина'"
    )
  })

  it("restores property refs after generic ref registry is cleared", () => {
    clearJSONSchemaRefRegistries()
    const schema = exportJSONSchemaForSchemaName({ context, name: "UsualGroup" })

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
