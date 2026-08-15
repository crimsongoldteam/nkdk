import fs from "fs"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"

import { childSegmentUid, childUid, XML_PRESENT_TAG_VALUE, importFromYAML, markYAMLScalarTag } from "@nkdk/runtime"
import { mockContextToXML } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import type { ClientApplicationFormXML, ClientApplicationFormYAML, FormMetadataXML } from "./types"
import { convertClientApplicationFormFromYAMLToXML } from "./fromYAMLToXML"
import { convertClientApplicationFormYAMLToXMLCore } from "./convertYAMLToXML"
import { createValidationOwnerFacts } from "../../validation/dataPath/ownerFacts"
import { createLayeredOwnerMetadataCacheForTests } from "../../../tests/layeredOwnerMetadataCache"
import { buildObjectFieldIndex } from "../../validation/dataPath/objectFields"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"
import { MetadataDocumentRules } from "../../appliedObjects/metadataDocument/rules"
import { getTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import {
  ClientApplicationFormWithExtendedPresentationRules,
} from "./rules"
import { testConfigurationIndexReader } from "../../../tests/configurationIndex"
import { prepareFormDataPathContextFromYAML } from "./formDataPathContext"
import { createDirectRoundTripContexts } from "../../../tests/directConversion"

describe("convertClientApplicationFormFromYAMLToXML", () => {
  const formWithMainAttribute = (
    type: string,
    properties: Partial<ClientApplicationFormYAML> = {}
  ): ClientApplicationFormYAML =>
    ({
      ...properties,
      Реквизиты: {
        Объект: { Тип: type, ОсновнойРеквизит: "Истина" },
      },
    }) as ClientApplicationFormYAML

  it("public converter and BaseForm use the same conversion core", () => {
    const params = {
      context: mockContextToXML(),
      yaml: {} as ClientApplicationFormYAML,
      name: "Форма",
    }

    expect(convertClientApplicationFormFromYAMLToXML(params)).toEqual(
      convertClientApplicationFormYAMLToXMLCore(params)
    )
  })

  it("не создаёт Form.xml для обычной формы", () => {
    const nestedRule = getTypeRule("ClientApplicationForm", "yamlToXMLNestedRule")
    if (nestedRule?.kind !== "externalFile") throw new Error("Не зарегистрировано вложенное правило формы")

    expect(nestedRule.convert({
      context: mockContextToXML(),
      yaml: { ТипФормы: "Обычная" },
      ownerYAML: { ТипФормы: "Обычная" },
      name: "ОбычнаяФорма",
      referenceXML: undefined,
    })).toBeUndefined()
  })

  it("создаёт Form.xml для управляемой формы с неявным типом", () => {
    const nestedRule = getTypeRule("ClientApplicationForm", "yamlToXMLNestedRule")
    if (nestedRule?.kind !== "externalFile") throw new Error("Не зарегистрировано вложенное правило формы")

    expect(nestedRule.convert({
      context: mockContextToXML(),
      yaml: {},
      ownerYAML: {},
      name: "УправляемаяФорма",
      referenceXML: undefined,
    })).toHaveProperty("Form")
  })

  it("восстанавливает платформенное назначение при отсутствии YAML-поля", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {} as ClientApplicationFormYAML,
      name: "Форма",
    })

    expect(result.metadataXML.Form.Properties.UsePurposes).toEqual({
      "v8:Value": {
        "_xsi:type": "app:ApplicationUsePurpose",
        "#text": "PlatformApplication",
      },
    })
  })

  it.each([
    ["МобильноеПриложение", ["MobilePlatformApplication"]],
    ["ПлатформаИМобильноеПриложение", ["PlatformApplication", "MobilePlatformApplication"]],
  ] as const)("экспортирует явное назначение %s", (yamlValue, xmlValues) => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: { НазначенияИспользования: yamlValue } as ClientApplicationFormYAML,
      name: "Форма",
    })
    const value = result.metadataXML.Form.Properties.UsePurposes["v8:Value"]

    expect(Array.isArray(value) ? value.map((item) => item["#text"]) : [value["#text"]]).toEqual(xmlValues)
  })

  it.each([
    ["основной реквизит справочника", "СправочникОбъект.Товары", "Истина", "Items"],
    [
      "основной реквизит ПВХ",
      "ПланВидовХарактеристикОбъект.ВидыСубконто",
      "Истина",
      "Items",
    ],
    ["основной реквизит документа", "ДокументОбъект.Заказ", "Истина", undefined],
    ["неосновной реквизит справочника", "СправочникОбъект.Товары", "Ложь", undefined],
    ["составной тип со справочником", ["Строка", "СправочникОбъект.Товары"], "Истина", "Items"],
    [
      "составной объектный тип со справочником",
      ["ДокументОбъект.Заказ", "СправочникОбъект.Товары"],
      "Истина",
      "Items",
    ],
  ] as const)("восстанавливает UseForFoldersAndItems: %s", (_case, type, mainAttribute, expected) => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {
        Реквизиты: {
          Объект: { Тип: type, ОсновнойРеквизит: mainAttribute },
        },
      } as ClientApplicationFormYAML,
      name: "ФормаЭлемента",
    })

    if (expected === undefined) expect(result.formXML).not.toHaveProperty("UseForFoldersAndItems")
    else expect(result.formXML).toHaveProperty("UseForFoldersAndItems", expected)
  })

  it("не создаёт UseForFoldersAndItems у формы без реквизитов", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {} as ClientApplicationFormYAML,
      name: "Форма",
    })

    expect(result.formXML).not.toHaveProperty("UseForFoldersAndItems")
  })

  it("находит подходящий основной реквизит среди реквизитов разных типов", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {
        Реквизиты: {
          Документ: { Тип: "ДокументОбъект.Заказ", ОсновнойРеквизит: "Истина" },
          Объект: { Тип: "СправочникОбъект.Товары", ОсновнойРеквизит: "Истина" },
        },
      } as ClientApplicationFormYAML,
      name: "Форма",
    })

    expect(result.formXML).toHaveProperty("UseForFoldersAndItems", "Items")
  })

  it("сохраняет явное Folders независимо от неявного Items", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {
        ИспользованиеДляГруппИЭлементов: "Группы",
        Реквизиты: {
          Объект: { Тип: "СправочникОбъект.Товары", ОсновнойРеквизит: "Истина" },
        },
      } as ClientApplicationFormYAML,
      name: "ФормаЭлемента",
    })

    expect(result.formXML).toHaveProperty("UseForFoldersAndItems", "Folders")
  })

  it("восстанавливает XML-defaults формы документа только по основному реквизиту", () => {
    const implicit = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: formWithMainAttribute("ДокументОбъект.Заказ"),
      name: "ФормаДокумента",
    })
    expect(implicit.formXML).toMatchObject({
      AutoTime: "CurrentOrLast",
      UsePostingMode: "Auto",
      RepostOnWrite: true,
    })

    const explicit = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: formWithMainAttribute("ДокументОбъект.Заказ", {
        АвтоВремя: "Последним",
        РежимПроведения: "Неоперативный",
        ПерепроводитьПриЗаписи: "Ложь",
      }),
      name: "ФормаДокумента",
    })
    expect(explicit.formXML).toMatchObject({
      AutoTime: "Last",
      UsePostingMode: "Regular",
      RepostOnWrite: false,
    })

    const other = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: formWithMainAttribute("СправочникОбъект.Товары"),
      name: "ФормаСправочника",
    })
    expect(other.formXML).not.toHaveProperty("AutoTime")
    expect(other.formXML).not.toHaveProperty("UsePostingMode")
    expect(other.formXML).not.toHaveProperty("RepostOnWrite")
  })

  it("восстанавливает XML-defaults формы отчёта и сохраняет явные значения", () => {
    const implicit = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: formWithMainAttribute("ОтчетОбъект.Продажи"),
      name: "ФормаОтчета",
    })
    expect(implicit.formXML).toMatchObject({
      ReportFormType: "Main",
      AutoShowState: "Auto",
      ReportResultViewMode: "Auto",
      ViewModeApplicationOnSetReportResult: "Auto",
    })

    const explicit = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: formWithMainAttribute("ОтчетОбъект.Продажи", {
        ТипФормыОтчета: "Настройка",
        АвтоОтображениеСостояния: "НеОтображать",
        РежимОтображенияРезультатаОтчета: "Обычный",
      }),
      name: "ФормаНастроек",
    })
    expect(explicit.formXML).toMatchObject({
      ReportFormType: "Settings",
      AutoShowState: "DontShow",
      ReportResultViewMode: "Default",
    })
  })

  it("формирует описание и содержимое формы прямо из YAML", () => {
    const yamlPath = fileURLToPath(new URL("__fixtures__/sync/yaml/Формы/ФормаЭлемента/Форма.yaml", import.meta.url))
    const yaml = importFromYAML<ClientApplicationFormYAML>(fs.readFileSync(yamlPath, "utf8"))
    const referenceFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "full.xml")
    const referenceMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "fullMetadata.xml"
    )

    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml,
      name: "ФормаЭлемента",
      referenceFormXML: referenceFormXML.Form,
      referenceMetadataXML: referenceMetadataXML.MetaDataObject,
    })

    expect(result.metadataXML.Form.Properties).toBeDefined()
    expect(result.formXML.ChildItems).toBeDefined()
    const childItems = Array.isArray(result.formXML.ChildItems)
      ? result.formXML.ChildItems
      : result.formXML.ChildItems?.ChildItem
    const firstChild = Array.isArray(childItems) ? childItems[0] : childItems
    expect(firstChild?.InputField?.ContextMenu).toBeDefined()
    expect(firstChild?.InputField?.ExtendedTooltip).toBeDefined()
  })

  it("создаёт обязательные одиночные элементы формы без identity в снимке", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
      targetProjectPath: "Справочники/Товары/Формы/ФормаЭлемента.yaml",
    })

    const context = contexts.exportContext()
    const result = convertClientApplicationFormFromYAMLToXML({
      context,
      yaml: {
        Элементы: {
          Поле: { Вид: "ПолеВвода" },
        },
      } as ClientApplicationFormYAML,
      name: "ФормаЭлемента",
    })

    const autoCommandBar = result.formXML.AutoCommandBar as Record<string, unknown>
    const inputField = elementByName(result.formXML, "Поле")
    expect(autoCommandBar).toMatchObject({
      _name: "ФормаКоманднаяПанель",
      _id: "-1",
    })
    expect(inputField).toMatchObject({
      ContextMenu: { _name: "ПолеКонтекстноеМеню" },
      ExtendedTooltip: { _name: "ПолеРасширеннаяПодсказка" },
    })
    const formAddress = "Справочник.Товары.Форма.ФормаЭлемента"
    const inputAddress = childUid(formAddress, "Элемент", "Поле")
    const identities = new Map(
      context.exportToXML.configurationIndex?.collector
        .fragment("Справочники/Товары/Формы/ФормаЭлемента.yaml")
        .entities.map((entity) => [entity.logicalAddress, entity.xmlId]),
    )
    expect(identities.get(childUid(formAddress, "Элемент", "ФормаКоманднаяПанель"))).toBe("-1")
    expect(identities.get(inputAddress)).toBe(inputField._id)
    expect(identities.get(childSegmentUid(inputAddress, "КонтекстноеМеню"))).toBe(
      (inputField.ContextMenu as Record<string, unknown>)._id,
    )
    expect(identities.get(childSegmentUid(inputAddress, "РасширеннаяПодсказка"))).toBe(
      (inputField.ExtendedTooltip as Record<string, unknown>)._id,
    )
  })

  it("формирует дополнительные колонки реквизита без модели", () => {
    const yaml = importFromYAML<ClientApplicationFormYAML>(
      [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Строка",
        "    ДополнительныеКолонки:",
        "      Список.Пустая: {}",
        "      Список.Способы:",
        "        Реквизит1:",
        "          Тип: Строка",
      ].join("\n")
    )

    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml,
      name: "ФормаСписка",
    })

    expect(result.formXML.Attributes?.Attribute).toEqual([
      expect.objectContaining({
        _name: "Объект",
        Columns: {
          AdditionalColumns: [
            { _table: "Список.Пустая" },
            {
              _table: "Список.Способы",
              Column: [expect.objectContaining({ _name: "Реквизит1" })],
            },
          ],
        },
      }),
    ])

    const attributes = result.formXML.Attributes?.Attribute
    const attribute = Array.isArray(attributes) ? attributes[0] : attributes
    const additionalColumns = attribute !== undefined && "Columns" in attribute ? attribute.Columns?.AdditionalColumns : []
    expect(Array.isArray(additionalColumns) ? additionalColumns : [additionalColumns]).toContainEqual({
      _table: "Список.Пустая",
    })
  })

  it("восстанавливает пустой контейнер реквизитов из !xml/present без reference XML", () => {
    const yaml = { Реквизиты: XML_PRESENT_TAG_VALUE } as unknown as ClientApplicationFormYAML
    markYAMLScalarTag(yaml, "Реквизиты", "xml/present")
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml,
      name: "Форма",
    })

    expect(result.formXML.Attributes).toEqual({})
  })

  it("создаёт обязательный пустой Attributes формы расширения без YAML-поля", () => {
    const baseContext = mockContextToXML()
    const result = convertClientApplicationFormFromYAMLToXML({
      context: {
        ...baseContext,
        exportToXML: {
          ...baseContext.exportToXML,
          xmlDefaultVariantByLogicalAddress: { "ОбщаяФорма.Форма": "adopted" },
        },
      },
      yaml: {},
      name: "Форма",
    })

    expect(result.formXML.Attributes).toEqual({ Attribute: [] })
  })

  it("добавляет служебные узлы по конечному источнику таблицы без reference XML", () => {
    const convert = (requisites: ClientApplicationFormYAML["Реквизиты"], dataPath?: string) =>
      firstTable(
        convertClientApplicationFormFromYAMLToXML({
          context: mockContextToXML(),
          yaml: {
            Реквизиты: requisites,
            Элементы: {
              Таблица: {
                Вид: "ТаблицаФормы",
                ...(dataPath === undefined ? {} : { ПутьКДанным: dataPath }),
              },
            },
          } as ClientApplicationFormYAML,
          name: "Форма",
        }).formXML
      )
    const period = {
      "v8:variant": { "#text": "Custom", "_xsi:type": "v8:StandardPeriodVariant" },
      "v8:startDate": "0001-01-01T00:00:00",
      "v8:endDate": "0001-01-01T00:00:00",
    }

    const dynamicList = convert({ Список: { Тип: "ДинамическийСписок" } }, "Список")
    expect(dynamicList.Period).toEqual(period)
    expect(dynamicList.TopLevelParent).toEqual({ "_xsi:nil": "true" })
    expect(dynamicList.RowFilter).toBeUndefined()

    const nestedDynamicList = convert({ Список: { Тип: "ДинамическийСписок" } }, "Список.Filter")
    expect(nestedDynamicList.Period).toBeUndefined()
    expect(nestedDynamicList.TopLevelParent).toBeUndefined()
    expect(nestedDynamicList.RowFilter).toBeUndefined()

    const valueTable = convert({ Таблица: { Тип: "ТаблицаЗначений" } }, "Таблица")
    expect(valueTable.Period).toBeUndefined()
    expect(valueTable.TopLevelParent).toBeUndefined()
    expect(valueTable.RowFilter).toBeUndefined()

    const valueTree = convert({ Дерево: { Тип: "ДеревоЗначений" } }, "Дерево")
    expect(valueTree.Period).toBeUndefined()
    expect(valueTree.TopLevelParent).toBeUndefined()
    expect(valueTree.RowFilter).toBeUndefined()

    for (const [name, type] of [
      ["СписокЗначений", "СписокЗначений"],
      ["Диаграмма", "ДиаграммаГанта"],
    ] as const) {
      const table = convert({ [name]: { Тип: type } }, name)
      expect(table.Period).toBeUndefined()
      expect(table.TopLevelParent).toBeUndefined()
      expect(table.RowFilter).toBeUndefined()
    }

    const registerRecordSet = convert(
      { НаборЗаписей: { Тип: "РегистрСведенийНаборЗаписей.Настройки" } },
      "НаборЗаписей"
    )
    expect(registerRecordSet.Period).toBeUndefined()
    expect(registerRecordSet.TopLevelParent).toBeUndefined()
    expect(registerRecordSet.RowFilter).toBeUndefined()

    const scalar = convert({ Значение: { Тип: "Строка" } }, "Значение")
    expect(scalar.Period).toBeUndefined()
    expect(scalar.TopLevelParent).toBeUndefined()
    expect(scalar.RowFilter).toBeUndefined()

    const settingsComposer = convert(
      { Компоновщик: { Тип: "КомпоновщикНастроекКомпоновкиДанных" } },
      "Компоновщик.Настройки.Отбор"
    )
    expect(settingsComposer.Period).toBeUndefined()
    expect(settingsComposer.TopLevelParent).toBeUndefined()
    expect(settingsComposer.RowFilter).toBeUndefined()

    const tabularSection = firstTable(
      convertClientApplicationFormFromYAMLToXML({
        context: contextWithLayeredDocumentOwner(),
        yaml: {
          Реквизиты: { Объект: { Тип: "ДокументОбъект.Заказ" } },
          Элементы: { Товары: { Вид: "ТаблицаФормы", ПутьКДанным: "Объект.Товары" } },
        } as ClientApplicationFormYAML,
        name: "ФормаДокумента",
      }).formXML
    )
    expect(tabularSection.Period).toBeUndefined()
    expect(tabularSection.TopLevelParent).toBeUndefined()
    expect(tabularSection.RowFilter).toBeUndefined()

    const missing = convert({}, undefined)
    expect(missing.Period).toBeUndefined()
    expect(missing.TopLevelParent).toBeUndefined()
    expect(missing.RowFilter).toBeUndefined()

    for (const unresolvedPath of ["", "НеизвестныйИсточник"]) {
      const unresolved = convert({}, unresolvedPath)
      expect(unresolved.Period).toBeUndefined()
      expect(unresolved.TopLevelParent).toBeUndefined()
      expect(unresolved.RowFilter).toBeUndefined()
    }
  })

  it("разрешает конечный тип вложенной таблицы после CurrentData", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {
        Реквизиты: {
          Строки: {
            Тип: "ТаблицаЗначений",
            Колонки: {
              ВложеннаяТаблица: { Тип: "ТаблицаЗначений" },
              ВложенноеДерево: { Тип: "ДеревоЗначений" },
            },
          },
        },
        Элементы: {
          Строки: { Вид: "ТаблицаФормы", ПутьКДанным: "Строки" },
          ВложеннаяТаблица: {
            Вид: "ТаблицаФормы",
            ПутьКДанным: "Элементы.Строки.ТекущиеДанные.ВложеннаяТаблица",
          },
          ВложенноеДерево: {
            Вид: "ТаблицаФормы",
            ПутьКДанным: "Элементы.Строки.ТекущиеДанные.ВложенноеДерево",
          },
        },
      } as ClientApplicationFormYAML,
      name: "Форма",
    })

    expect(tableByName(result.formXML, "ВложеннаяТаблица").RowFilter).toBeUndefined()
    expect(tableByName(result.formXML, "ВложенноеДерево").RowFilter).toBeUndefined()
  })

  it("преобразует рекурсивные пути SettingsComposer и не создаёт для них RowFilter", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {
        Реквизиты: { КомпоновщикНастроек: { Тип: "КомпоновщикНастроекКомпоновкиДанных" } },
        Элементы: {
          КомпоновщикНастроекНастройки: {
            Вид: "ТаблицаФормы",
            ПутьКДанным: "КомпоновщикНастроек.Настройки",
          },
          КомпоновщикНастроекНастройкиЭлементПараметрыДанных: {
            Вид: "ТаблицаФормы",
            ПутьКДанным: "Элементы.КомпоновщикНастроекНастройки.ТекущиеДанные.ЭлементПараметрыДанных",
          },
          Параметр: {
            Вид: "ПолеВвода",
            ПутьКДанным:
              "Элементы.КомпоновщикНастроекНастройкиЭлементПараметрыДанных.ТекущиеДанные.Параметр",
          },
        },
      } as ClientApplicationFormYAML,
      name: "Форма",
    })

    expect(tableByName(result.formXML, "КомпоновщикНастроекНастройки")).toMatchObject({
      DataPath: "КомпоновщикНастроек.Settings",
    })
    expect(tableByName(result.formXML, "КомпоновщикНастроекНастройки").RowFilter).toBeUndefined()
    expect(tableByName(result.formXML, "КомпоновщикНастроекНастройкиЭлементПараметрыДанных")).toMatchObject({
      DataPath: "Items.КомпоновщикНастроекНастройки.CurrentData.ItemDataParameters",
    })
    expect(tableByName(result.formXML, "КомпоновщикНастроекНастройкиЭлементПараметрыДанных").RowFilter)
      .toBeUndefined()
    expect(elementByName(result.formXML, "Параметр").DataPath).toBe(
      "Items.КомпоновщикНастроекНастройкиЭлементПараметрыДанных.CurrentData.Parameter",
    )
  })

  it("восстанавливает исключительный RowFilter из !xml/present без reference и configuration index", () => {
    const yaml = importFromYAML<ClientApplicationFormYAML>([
      "Реквизиты:",
      "  КомпоновщикНастроек:",
      "    Тип: КомпоновщикНастроекКомпоновкиДанных",
      "Элементы:",
      "  Настройки:",
      "    Вид: ТаблицаФормы",
      "    ПутьКДанным: КомпоновщикНастроек.Настройки",
      "  Порядок:",
      "    Вид: ТаблицаФормы",
      "    ПутьКДанным: Элементы.Настройки.ТекущиеДанные.ЭлементПорядок",
      "    ОтборСтрок: !xml/present",
    ].join("\n"))

    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml,
      name: "Форма",
    })

    expect(tableByName(result.formXML, "Порядок").RowFilter).toEqual({ "_xsi:nil": "true" })
  })

  it("не заменяет !xml/present RowFilter таблицы значений на false", () => {
    const yaml = importFromYAML<ClientApplicationFormYAML>([
      "Реквизиты:",
      "  Строки:",
      "    Тип: ТаблицаЗначений",
      "    Колонки:",
      "      Значение:",
      "        Тип: Строка",
      "Элементы:",
      "  Строки:",
      "    Вид: ТаблицаФормы",
      "    ПутьКДанным: Строки",
      "    ОтборСтрок: !xml/present",
      "    Элементы:",
      "      СтрокиЗначение:",
      "        Вид: ПолеВвода",
    ].join("\n"))

    const nestedRule = getTypeRule("ClientApplicationForm", "yamlToXMLNestedRule")
    if (nestedRule?.kind !== "externalFile") throw new Error("Не зарегистрировано вложенное правило формы")
    const result = nestedRule.convert({
      context: mockContextToXML(),
      yaml,
      ownerYAML: {},
      baseConfigurationIndex: testConfigurationIndexReader(),
      name: "Форма",
      referenceXML: undefined,
    })
    if (result === undefined) throw new Error("Управляемая форма не преобразована")

    expect(tableByName(result.Form as ClientApplicationFormXML, "Строки").RowFilter)
      .toEqual({ "_xsi:nil": "true" })
  })

  it("восстанавливает свойства таблицы только для прямого динамического списка", () => {
    const convert = (requisites: ClientApplicationFormYAML["Реквизиты"], dataPath: string) =>
      convertClientApplicationFormFromYAMLToXML({
        context: mockContextToXML(),
        yaml: {
          Реквизиты: requisites,
          Элементы: { Таблица: { Вид: "ТаблицаФормы", ПутьКДанным: dataPath } },
        } as ClientApplicationFormYAML,
        name: "Форма",
      })

    const direct = firstTable(convert({ Список: { Тип: "ДинамическийСписок" } }, "Список").formXML)
    const ordinary = firstTable(convert({ Таблица: { Тип: "ТаблицаЗначений" } }, "Таблица").formXML)
    const scalar = firstTable(convert({ Флаг: { Тип: "Булево" } }, "Флаг").formXML)
    const nested = firstTable(convert({ Список: { Тип: "ДинамическийСписок" } }, "Список.Filter").formXML)
    const missing = firstTable(
      convertClientApplicationFormFromYAMLToXML({
        context: mockContextToXML(),
        yaml: { Элементы: { Таблица: { Вид: "ТаблицаФормы" } } } as ClientApplicationFormYAML,
        name: "Форма",
      }).formXML
    )

    const defaults = {
      AutoRefresh: false,
      AutoRefreshPeriod: 60,
      ChoiceFoldersAndItems: "Items",
      RestoreCurrentRow: false,
      ShowRoot: true,
      AllowRootChoice: false,
      UpdateOnDataChange: "Auto",
      AllowGettingCurrentRowURL: true,
    }
    expect(direct).toMatchObject(defaults)
    for (const xmlName of Object.keys(defaults)) {
      expect(ordinary).not.toHaveProperty(xmlName)
      expect(scalar).not.toHaveProperty(xmlName)
      expect(nested).not.toHaveProperty(xmlName)
      expect(missing).not.toHaveProperty(xmlName)
    }
  })

  it("выгружает явные свойства прямой таблицы динамического списка", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {
        Реквизиты: { Список: { Тип: "ДинамическийСписок" } },
        Элементы: {
          Список: {
            Вид: "ТаблицаФормы",
            ПутьКДанным: "Список",
            АвтоОбновление: "Истина",
            ПериодАвтоОбновления: 30,
            ВыборГруппИЭлементов: "Группы",
            ВосстанавливатьТекущуюСтроку: "Истина",
            ОтображатьКорень: "Ложь",
            РазрешитьВыборКорня: "Истина",
            ОбновлениеПриИзмененииДанных: "НеОбновлять",
            РазрешитьПолучатьНавигационнуюСсылкуТекущейСтроки: "Ложь",
          },
        },
      } as ClientApplicationFormYAML,
      name: "ФормаСписка",
    })

    expect(firstTable(result.formXML)).toMatchObject({
      AutoRefresh: true,
      AutoRefreshPeriod: 30,
      ChoiceFoldersAndItems: "Folders",
      RestoreCurrentRow: true,
      ShowRoot: false,
      AllowRootChoice: true,
      UpdateOnDataChange: "DontUpdate",
      AllowGettingCurrentRowURL: false,
    })
  })

  it("вычисляет служебные узлы таблицы независимо от reference XML", () => {
    const period = {
      "v8:variant": { "#text": "Custom", "_xsi:type": "v8:StandardPeriodVariant" },
      "v8:startDate": "0001-01-01T00:00:00",
      "v8:endDate": "0001-01-01T00:00:00",
    }
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {
        Реквизиты: { Список: { Тип: "ДинамическийСписок" } },
        Элементы: { Список: { Вид: "ТаблицаФормы", ПутьКДанным: "Список" } },
      } as ClientApplicationFormYAML,
      name: "ФормаСписка",
      referenceFormXML: {
        ChildItems: [
          {
            Table: {
              _name: "Список",
              _id: "1",
              Period: period,
              TopLevelParent: { "_xsi:nil": "true" },
              RowFilter: { "_xsi:nil": "true" },
            },
          },
        ],
      },
    })

    expect(firstTable(result.formXML)).toMatchObject({
      Period: period,
      TopLevelParent: { "_xsi:nil": "true" },
    })
    expect(firstTable(result.formXML).RowFilter).toBeUndefined()
  })

  it("сохраняет идентификаторы команд из reference XML по имени", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {
        Команды: {
          Команда1: { Заголовок: "Команда один" },
          Команда2: { Заголовок: "Команда два" },
        },
      } as ClientApplicationFormYAML,
      name: "Форма",
      referenceFormXML: {
        Commands: {
          Command: [
            { _name: "Команда1", _id: "7" },
            { _name: "Команда2", _id: "9" },
          ],
        },
      },
    })

    expect(result.formXML.Commands?.Command).toEqual([
      expect.objectContaining({ _name: "Команда1", _id: "7" }),
      expect.objectContaining({ _name: "Команда2", _id: "9" }),
    ])
  })

  it("восстанавливает общие metadata-default без reference XML", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {} as ClientApplicationFormYAML,
      name: "Минимальная",
    })

    expect(result.metadataXML.Form.Properties.IncludeHelpInContents).toBe(false)
    expect(result.metadataXML.Form.Properties).not.toHaveProperty(
      "ExtendedPresentation"
    )
  })

  it("восстанавливает пустое расширенное представление специализированной формы", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {} as ClientApplicationFormYAML,
      name: "ФормаОтчета",
      rule: ClientApplicationFormWithExtendedPresentationRules,
    })

    expect(result.metadataXML.Form.Properties.ExtendedPresentation).toBe("")
  })

  it("экспортирует заполненное расширенное представление специализированной формы", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {
        РасширенноеПредставление: { ru: "Продажи" },
      } as ClientApplicationFormYAML,
      name: "ФормаОтчета",
      rule: ClientApplicationFormWithExtendedPresentationRules,
    })

    expect(result.metadataXML.Form.Properties.ExtendedPresentation).toEqual({
      "v8:item": [
        {
          "v8:lang": "ru",
          "v8:content": "Продажи",
        },
      ],
    })
  })

  it("возвращает стандартный реквизит DataPath по готовым индексам расширения", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: contextWithLayeredCatalogOwner(),
      yaml: {
        Реквизиты: {
          Объект: { Тип: "СправочникОбъект.СправочникПолный" },
        },
        Элементы: {
          Код: {
            Вид: "ПолеВвода",
            ПутьКДанным: "Объект.Код",
          },
        },
      } as ClientApplicationFormYAML,
      name: "ФормаЭлемента",
    })

    expect(firstInputField(result.formXML).DataPath).toBe("Объект.Code")
  })

  it("восстанавливает отсутствующие DataPath собственных элементов", () => {
    const yaml = {
      Реквизиты: {
        Объект: { Тип: "ДокументОбъект.Заказ", ОсновнойРеквизит: "Истина" },
      },
      Элементы: {
        Номер: { Вид: "ПолеВвода" },
        Товары: {
          Вид: "ТаблицаФормы",
          Элементы: {
            Группа: {
              Вид: "ГруппаКолонок",
              Элементы: {
                ТоварыКоличество: { Вид: "ПолеВвода" },
              },
            },
          },
        },
      },
    } satisfies ClientApplicationFormYAML

    const result = convertClientApplicationFormFromYAMLToXML({
      context: contextWithLayeredDocumentOwner(),
      yaml,
      name: "ФормаДокумента",
    })

    expect(elementByName(result.formXML, "Номер").DataPath).toBe("Объект.Number")
    expect(elementByName(result.formXML, "Товары").DataPath).toBe("Объект.Товары")
    expect(elementByName(result.formXML, "ТоварыКоличество").DataPath).toBe("Объект.Товары.Количество")
    expect(yaml.Элементы.Номер).not.toHaveProperty("ПутьКДанным")
  })

  it("не создаёт DataPath при явной пустой строке и сохраняет вспомогательный путь", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: contextWithLayeredDocumentOwner(),
      yaml: {
        Реквизиты: {
          Объект: { Тип: "ДокументОбъект.Заказ", ОсновнойРеквизит: "Истина" },
        },
        Элементы: {
          Товары: {
            Вид: "ТаблицаФормы",
            ПутьКДанным: "",
            ПутьКДаннымКартинкиСтроки: "Объект.Товары.Количество",
            Элементы: {
              ТоварыКоличество: { Вид: "ПолеВвода", ПутьКДанным: "" },
            },
          },
        },
      } as ClientApplicationFormYAML,
      name: "ФормаДокумента",
    })

    expect(elementByName(result.formXML, "Товары").DataPath).toBeUndefined()
    expect(elementByName(result.formXML, "ТоварыКоличество").DataPath).toBeUndefined()
    expect(elementByName(result.formXML, "Товары").RowPictureDataPath).toBe("Объект.Товары.Количество")
  })

  it("не материализует отсутствующий DataPath заимствованного элемента", () => {
    const context = contextWithLayeredDocumentOwner()
    const ownerCache = context.importFromYAML?.ownerMetadataCache
    if (ownerCache === undefined) throw new Error("Тестовый кэш владельца не создан")
    const yaml = {
      Элементы: { Номер: { Вид: "ПолеВвода" } },
    } satisfies ClientApplicationFormYAML
    const formDataPathContext = prepareFormDataPathContextFromYAML({
      yaml,
      currentConfigurationFormYaml: {
        Реквизиты: {
          Объект: { Тип: "ДокументОбъект.Заказ", ОсновнойРеквизит: "Истина" },
        },
        Элементы: { Номер: { Вид: "ПолеВвода", ПутьКДанным: "Объект.Номер" } },
      },
      ownerCache,
    })

    const result = convertClientApplicationFormFromYAMLToXML({
      context,
      yaml,
      name: "ФормаДокумента",
      formDataPathContext,
    })

    expect(elementByName(result.formXML, "Номер").DataPath).toBeUndefined()
  })

  it("использует текущую cf без БазоваяФорма.yaml для заимствованного и собственного элементов", () => {
    const currentConfigurationFormYaml = {
      Реквизиты: {
        Объект: { Тип: "ДокументОбъект.Заказ", ОсновнойРеквизит: "Истина" },
      },
      Элементы: { Номер: { Вид: "ПолеВвода", ПутьКДанным: "Объект.Номер" } },
    } satisfies ClientApplicationFormYAML

    const result = convertClientApplicationFormFromYAMLToXML({
      context: contextWithLayeredDocumentOwner(),
      yaml: {
        Элементы: {
          Номер: { Вид: "ПолеВвода" },
          Дата: { Вид: "ПолеВвода" },
        },
      } satisfies ClientApplicationFormYAML,
      currentConfigurationFormYaml,
      name: "ФормаДокумента",
    })

    expect(elementByName(result.formXML, "Номер").DataPath).toBeUndefined()
    expect(elementByName(result.formXML, "Дата").DataPath).toBe("Объект.Date")
  })

  it("строит путь собственной колонки из пути заимствованной таблицы текущей cf", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: contextWithLayeredDocumentOwner(),
      yaml: {
        Элементы: {
          Товары: {
            Вид: "ТаблицаФормы",
            Элементы: { ТоварыКоличество: { Вид: "ПолеВвода" } },
          },
        },
      } as ClientApplicationFormYAML,
      currentConfigurationFormYaml: {
        Реквизиты: {
          Объект: { Тип: "ДокументОбъект.Заказ", ОсновнойРеквизит: "Истина" },
        },
        Элементы: {
          Товары: { Вид: "ТаблицаФормы", ПутьКДанным: "Объект.Товары" },
        },
      } as ClientApplicationFormYAML,
      name: "ФормаДокумента",
    })

    expect(elementByName(result.formXML, "Товары").DataPath).toBeUndefined()
    expect(elementByName(result.formXML, "ТоварыКоличество").DataPath)
      .toBe("Объект.Товары.Количество")
  })

  it("сохраняет явный override заимствованного элемента", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: contextWithLayeredDocumentOwner(),
      yaml: {
        Элементы: { Номер: { Вид: "ПолеВвода", ПутьКДанным: "Объект.Номер" } },
      } satisfies ClientApplicationFormYAML,
      currentConfigurationFormYaml: {
        Реквизиты: {
          Объект: { Тип: "ДокументОбъект.Заказ", ОсновнойРеквизит: "Истина" },
        },
        Элементы: { Номер: { Вид: "ПолеВвода", ПутьКДанным: "Объект.Номер" } },
      },
      name: "ФормаДокумента",
    })

    expect(elementByName(result.formXML, "Номер").DataPath).toBe("Объект.Number")
  })

  it("экспортирует payload tagged DataPath без преобразования внутренних имён", () => {
    const yaml = importFromYAML<ClientApplicationFormYAML>([
      "Реквизиты:",
      "  Объект:",
      "    Тип: СправочникОбъект.СправочникПолный",
      "Элементы:",
      "  Наименование:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: !xml/value Объект.Description",
    ].join("\n"))

    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml,
      name: "ФормаЭлемента",
    })

    expect(firstInputField(result.formXML).DataPath).toBe("Объект.Description")
    expect(firstInputField(result.formXML).DataPath).not.toContain("!xml")
  })

  it("строит BaseForm встроенной формы из отдельного базового YAML", () => {
    const nestedRule = getTypeRule(
      "ClientApplicationForm",
      "yamlToXMLNestedRule"
    )
    if (nestedRule?.kind !== "externalFile") {
      throw new Error("Не зарегистрировано вложенное правило формы")
    }

    const result = nestedRule.convert({
      context: mockContextToXML(),
      yaml: { Ширина: 100 },
      ownerYAML: {},
      baseYAML: { Ширина: 80 },
      baseConfigurationIndex: testConfigurationIndexReader(),
      name: "ОбщаяФорма",
      referenceXML: undefined,
    })
    if (result === undefined) throw new Error("Управляемая форма не преобразована")

    expect(result.Form).toMatchObject({
      Width: 100,
      BaseForm: {
        _version: "2.20",
        Width: 80,
      },
    })
  })

  it("классифицирует таблицу cfe по обычному baseYAML текущей cf", () => {
    const nestedRule = getTypeRule("ClientApplicationForm", "yamlToXMLNestedRule")
    if (nestedRule?.kind !== "externalFile") throw new Error("Не зарегистрировано вложенное правило формы")

    const result = nestedRule.convert({
      context: mockContextToXML(),
      yaml: {
        Элементы: { Список: { Вид: "ТаблицаФормы" } },
      },
      ownerYAML: {},
      baseYAML: {
        Реквизиты: { Список: { Тип: "ДинамическийСписок" } },
        Элементы: {
          Список: { Вид: "ТаблицаФормы", ПутьКДанным: "Список" },
        },
      },
      baseConfigurationIndex: testConfigurationIndexReader(),
      name: "ОбщаяФорма",
      referenceXML: undefined,
    })
    if (result === undefined) throw new Error("Управляемая форма не преобразована")
    const form = result.Form as ClientApplicationFormXML

    expect(elementByName(form, "Список").DataPath).toBeUndefined()
    expect(elementByName(form, "Список")).toMatchObject({
      AllowGettingCurrentRowURL: true,
      AllowRootChoice: false,
      AutoRefresh: false,
      AutoRefreshPeriod: 60,
      ChoiceFoldersAndItems: "Items",
      RestoreCurrentRow: false,
      ShowRoot: true,
      UpdateOnDataChange: "Auto",
    })
    expect(elementByName(form, "Список").Period).toEqual({
      "v8:variant": { "#text": "Custom", "_xsi:type": "v8:StandardPeriodVariant" },
      "v8:startDate": "0001-01-01T00:00:00",
      "v8:endDate": "0001-01-01T00:00:00",
    })
  })

  it("разделяет сохранённый BaseForm и текущую форму cf во вложенном преобразовании", () => {
    const nestedRule = getTypeRule("ClientApplicationForm", "yamlToXMLNestedRule")
    if (nestedRule?.kind !== "externalFile") throw new Error("Не зарегистрировано вложенное правило формы")
    const context = contextWithLayeredDocumentOwner()

    const result = nestedRule.convert({
      context,
      yaml: {
        Элементы: {
          Номер: { Вид: "ПолеВвода" },
          Дата: { Вид: "ПолеВвода" },
          Список: { Вид: "ТаблицаФормы" },
        },
      },
      ownerYAML: {},
      baseYAML: {
        kind: "selectedBaseYAML",
        baseFormSourceKind: "saved",
        baseFormYAML: { Ширина: 80, Элементы: { Список: { Вид: "ТаблицаФормы" } } },
        currentConfigurationFormYAML: {
          Реквизиты: {
            Объект: { Тип: "ДокументОбъект.Заказ", ОсновнойРеквизит: "Истина" },
            Список: { Тип: "ДинамическийСписок" },
          },
          Элементы: {
            Номер: { Вид: "ПолеВвода", ПутьКДанным: "Объект.Номер" },
            Список: { Вид: "ТаблицаФормы", ПутьКДанным: "Список" },
          },
        },
      },
      baseYAMLContext: context,
      name: "ФормаДокумента",
      referenceXML: undefined,
    })
    if (result === undefined) throw new Error("Управляемая форма не преобразована")
    const form = result.Form as ClientApplicationFormXML

    expect(form.BaseForm).toMatchObject({ Width: 80 })
    expect(elementByName(form, "Номер").DataPath).toBeUndefined()
    expect(elementByName(form, "Дата").DataPath).toBe("Объект.Date")
    expect(elementByName(form, "Список")).toMatchObject({ AutoRefresh: false, ShowRoot: true })
    expect(elementByName(form.BaseForm as ClientApplicationFormXML, "Список"))
      .toMatchObject({ AutoRefresh: false, ShowRoot: true })
  })
})

function firstTable(form: ClientApplicationFormXML): Record<string, unknown> {
  const childItems = Array.isArray(form.ChildItems) ? form.ChildItems : form.ChildItems?.ChildItem
  const first = Array.isArray(childItems) ? childItems[0] : childItems
  return first?.Table ?? {}
}

function tableByName(form: ClientApplicationFormXML, name: string): Record<string, unknown> {
  const childItems = Array.isArray(form.ChildItems) ? form.ChildItems : form.ChildItems?.ChildItem
  const items = Array.isArray(childItems) ? childItems : childItems === undefined ? [] : [childItems]
  return items.find((item) => item.Table?._name === name)?.Table ?? {}
}

function firstInputField(form: ClientApplicationFormXML): Record<string, unknown> {
  const childItems = Array.isArray(form.ChildItems) ? form.ChildItems : form.ChildItems?.ChildItem
  const first = Array.isArray(childItems) ? childItems[0] : childItems
  return first?.InputField ?? {}
}

function elementByName(form: ClientApplicationFormXML, name: string): Record<string, unknown> {
  const visit = (value: unknown): Record<string, unknown> | undefined => {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = visit(item)
        if (found !== undefined) return found
      }
      return undefined
    }
    if (value === null || typeof value !== "object") return undefined
    const record = value as Record<string, unknown>
    if (record._name === name) return record
    for (const child of Object.values(record)) {
      const found = visit(child)
      if (found !== undefined) return found
    }
    return undefined
  }
  return visit(form) ?? {}
}

function contextWithLayeredCatalogOwner() {
  const context = mockContextToXML()
  const ref = { kind: "Справочник", name: "СправочникПолный" }
  const filePath = "/project/cf/Справочник/СправочникПолный/Свойства.yaml"
  const initialFacts = createValidationOwnerFacts({
    ref,
    filePath,
    fieldIndex: {
      fields: new Map(),
      standardAttributeAliases: new Map(),
      diagnostics: [],
    },
    model: { itemType: "MetadataCatalog" },
  })
  const fieldIndex = buildObjectFieldIndex({
    ref,
    facts: initialFacts,
    rule: MetadataCatalogRules,
  })
  return {
    ...context,
    exportToYAML: {
      toTyped: false,
      ownerMetadataCache: createLayeredOwnerMetadataCacheForTests({ base: [{ ...initialFacts, fieldIndex }] }),
    },
  }
}

function contextWithLayeredDocumentOwner() {
  const context = mockContextToXML()
  const ref = { kind: "Документ", name: "Заказ" }
  const filePath = "/project/cf/Документ/Заказ/Свойства.yaml"
  const initialFacts = createValidationOwnerFacts({
    ref,
    filePath,
    fieldIndex: {
      fields: new Map(),
      standardAttributeAliases: new Map(),
      diagnostics: [],
    },
    model: {
      itemType: "MetadataDocument",
      tabularSections: [{
        itemType: "MetadataTabularSection",
        name: "Товары",
        attributes: [{ name: "Количество", type: { type: ["number"] } }],
      }],
    },
  })
  const ownerMetadataCache = createLayeredOwnerMetadataCacheForTests({
    base: [
      {
        ...initialFacts,
        fieldIndex: buildObjectFieldIndex({ ref, facts: initialFacts, rule: MetadataDocumentRules }),
      },
    ],
  })
  return {
    ...context,
    importFromYAML: {
      ...context.importFromYAML,
      ownerMetadataCache,
    },
  }
}
