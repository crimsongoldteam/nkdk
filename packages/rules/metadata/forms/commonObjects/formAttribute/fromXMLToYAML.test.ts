import fs from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../../tests/directConversion"
import {
  EMPTY_XML_TAG_VALUE,
  importContentFromXML,
  markYAMLScalarTag,
  xmlExport,
  yamlScalarTagAt,
} from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

import "../index"
import "./fromXMLToYAML"
import "./rules"

const rule = {
  itemType: "FormAttributesProbe",
  properties: {
    value: { type: "FormAttributes", yaml: "Значение", xml: "Attribute" },
  },
} as const satisfies MetadataItemRule

const fixtures = [
  "attributeAnyType.xml",
  "chartSettings.xml",
  "columnAnyType.xml",
  "ganttChartSettings.xml",
  "mixedColumns.xml",
  "plannerSettings.xml",
  "plannerSettingsWithNil.xml",
  "spreadsheetDocumentSettings.xml",
  "tableWithColumns.xml",
  "titleColumnsType.xml",
  "treeWithColumn.xml",
  "twoTables.xml",
  "valueListWithReferenceEmptySettings.xml",
  "valueListWithoutSettings.xml",
] as const

const settingsFixtures = [
  "chartSettings.xml",
  "ganttChartSettings.xml",
  "plannerSettings.xml",
  "plannerSettingsWithNil.xml",
  "spreadsheetDocumentSettings.xml",
  "valueListWithReferenceEmptySettings.xml",
] as const

describe("FormAttributes XML → YAML → XML", () => {
  it("различает отсутствие Settings у единственного ValueListType", () => {
    const { yaml } = testPropertyFromXMLToYAML({
      rule,
      xml: {
        Attribute: {
          _name: "Список",
          Type: { "v8:Type": "v8:ValueListType" },
        },
      },
    })
    const item = (yaml as { Значение: Record<string, Record<string, unknown>> }).Значение.Список!

    expect(item.ТипЗначения).toBe(EMPTY_XML_TAG_VALUE)
    expect(yamlScalarTagAt(item, "ТипЗначения")).toBe("xml")
  })

  it("не помечает отсутствие Settings у составного типа", () => {
    const { yaml } = testPropertyFromXMLToYAML({
      rule,
      xml: {
        Attribute: {
          _name: "Список",
          Type: { "v8:Type": ["v8:ValueListType", "xs:string"] },
        },
      },
    })
    const item = (yaml as { Значение: Record<string, Record<string, unknown>> }).Значение.Список!

    expect(item).not.toHaveProperty("ТипЗначения")
  })

  it("не создаёт Settings по маркеру отсутствия", () => {
    const item = {
      Тип: "СписокЗначений",
      ТипЗначения: EMPTY_XML_TAG_VALUE,
    }
    markYAMLScalarTag(item, "ТипЗначения", "xml")

    const { xml } = testPropertyFromYAMLToXML({
      rule,
      yaml: { Значение: { Список: item } },
    })
    const attribute = Array.isArray(xml.Attribute) ? xml.Attribute[0] : xml.Attribute

    expect(attribute).not.toHaveProperty("Settings")
  })

  it("создаёт канонический Settings без маркера", () => {
    const { xml } = testPropertyFromYAMLToXML({
      rule,
      yaml: { Значение: { Список: { Тип: "СписокЗначений" } } },
    })
    const attribute = Array.isArray(xml.Attribute) ? xml.Attribute[0] : xml.Attribute

    expect(attribute).toHaveProperty("Settings", { "_xsi:type": "v8:TypeDescription" })
  })

  it.each(fixtures)("сохраняет %s", (fixture) => {
    const { expected, result } = roundTripFixture(fixture, true)
    expect(result).toBe(expected.trim())
  })

  it.each(settingsFixtures)("восстанавливает %s без reference XML", (fixture) => {
    const { expected, result } = roundTripFixture(fixture, false)
    expect(result).toBe(expected.trim())
  })

  it("не помечает TypeDescription как присутствующий DynamicList", () => {
    const source = fs.readFileSync(
      fileURLToPath(new URL("__fixtures__/valueListWithReferenceEmptySettings.xml", import.meta.url)),
      "utf8",
    )
    const xml = importContentFromXML<Record<string, unknown>>(source, {
      preserveEmptyElements: true,
      preserveXsiNil: true,
    })
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "ОбщаяФорма.СписокЗначений",
    })
    const collection = contexts.importContext.fromXML.configurationIndex
    const importContext = collection === undefined
      ? contexts.importContext
      : {
          ...contexts.importContext,
          fromXML: {
            ...contexts.importContext.fromXML,
            configurationIndex: { ...collection, yamlPathAddressing: true as const },
          },
        }

    testPropertyFromXMLToYAML({ rule, xml, context: importContext })
    const entities = collection?.collector.fragment("Форма.yaml").entities ?? []

    expect(entities).not.toEqual(expect.arrayContaining([
      expect.objectContaining({
        logicalAddress: expect.stringContaining("ДинамическийСписок"),
        xml: expect.objectContaining({ present: true }),
      }),
    ]))
  })

  it("сохраняет отсутствие заголовка колонки как пустой YAML", () => {
    const source = fs.readFileSync(
      fileURLToPath(new URL("__fixtures__/tableWithColumns.xml", import.meta.url)),
      "utf8"
    )
    const xml = importContentFromXML<Record<string, unknown>>(source, {
      preserveEmptyElements: true,
      preserveXsiNil: true,
    })
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const { yaml } = testPropertyFromXMLToYAML({
      rule,
      xml,
      context: contexts.importContext,
    })

    expect(yaml).toMatchObject({
      Значение: {
        Таблица: {
          Колонки: {
            Колонка1: { Заголовок: "" },
            Колонка2: { Заголовок: "" },
          },
        },
      },
    })

    const roundTrip = testPropertyFromYAMLToXML({
      rule,
      yaml,
      context: contexts.exportContext(),
    })
    expect(xmlExport(roundTrip.xml, false)).not.toContain("<Title>")
  })

  it("исключает заголовок колонки, равный имени, из YAML", () => {
    const source = fs.readFileSync(
      fileURLToPath(new URL("__fixtures__/columnAnyType.xml", import.meta.url)),
      "utf8"
    )
    const xml = importContentFromXML<Record<string, unknown>>(source, {
      preserveEmptyElements: true,
      preserveXsiNil: true,
    })
    const { yaml } = testPropertyFromXMLToYAML({ rule, xml })

    expect(yaml).not.toHaveProperty(
      "Значение.ТаблицаСКолонкойБезТипа.Колонки.РеквизитБезТипа.Заголовок"
    )
  })

  it("восстанавливает заголовок колонки из имени при отсутствии поля в YAML", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const { xml } = testPropertyFromYAMLToXML({
      rule,
      yaml: {
        Значение: {
          Таблица: {
            Тип: "ТаблицаЗначений",
            Колонки: {
              РеквизитБезТипа: {},
            },
          },
        },
      },
      context: contexts.exportContext(),
    })

    expect(xmlExport(xml, false)).toContain("<v8:content>Реквизит без типа</v8:content>")
  })

  it("различает обычные и дополнительные колонки", () => {
    const { yaml } = testPropertyFromXMLToYAML({
      rule,
      xml: {
        Attribute: {
          _name: "Таблица",
          Type: { "v8:Type": "v8:ValueTable" },
          Columns: {
            Column: { _name: "Обычная", Type: { "v8:Type": "xs:string" } },
            AdditionalColumns: [
              { _table: "Таблица.Пустая" },
              {
                _table: "Таблица.Заполненная",
                Column: { _name: "Дополнительная", Type: { "v8:Type": "xs:boolean" } },
              },
            ],
          },
        },
      },
    })

    expect(yaml).toMatchObject({
      Значение: {
        Таблица: {
          Колонки: { Обычная: expect.any(Object) },
          ДополнительныеКолонки: {
            "Таблица.Пустая": {},
            "Таблица.Заполненная": { Дополнительная: expect.any(Object) },
          },
        },
      },
    })
  })

  it("восстанавливает id дополнительных колонок из индекса без reference XML", () => {
    const source = {
      Attribute: {
        _name: "Таблица",
        _id: "7",
        Type: { "v8:Type": "v8:ValueTable" },
        Columns: {
          AdditionalColumns: [
            {
              _table: "Таблица.Первая",
              Column: [
                { _name: "Код", _id: "1", Type: { "v8:Type": "xs:string" } },
                { _name: "Сумма", _id: "2", Type: { "v8:Type": "xs:decimal" } },
              ],
            },
            {
              _table: "Таблица.Вторая",
              Column: [
                { _name: "Код", _id: "1", Type: { "v8:Type": "xs:string" } },
                { _name: "Признак", _id: "2", Type: { "v8:Type": "xs:boolean" } },
              ],
            },
          ],
        },
      },
    }
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const yaml = testPropertyFromXMLToYAML({ rule, xml: source, context: contexts.importContext }).yaml
    const { xml } = testPropertyFromYAMLToXML({ rule, yaml, context: contexts.exportContext() })

    expect(xml).toMatchObject({
      Attribute: [
        {
          Columns: {
            AdditionalColumns: [
              {
                _table: "Таблица.Первая",
                Column: [
                  { _name: "Код", _id: "1" },
                  { _name: "Сумма", _id: "2" },
                ],
              },
              {
                _table: "Таблица.Вторая",
                Column: [
                  { _name: "Код", _id: "1" },
                  { _name: "Признак", _id: "2" },
                ],
              },
            ],
          },
        },
      ],
    })
  })

  it("не создаёт настройки динамического списка у обычного реквизита без reference XML", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "БизнесПроцесс.Заказ.Форма.ФормаЗадачи",
    })
    const source = {
      Attribute: {
        _name: "Объект",
        _id: "1",
        Type: { "v8:Type": "cfg:BusinessProcessObject.Заказ" },
        MainAttribute: true,
        SavedData: true,
      },
    }
    const yaml = testPropertyFromXMLToYAML({
      rule,
      xml: source,
      context: contexts.importContext,
    }).yaml
    const { xml } = testPropertyFromYAMLToXML({
      rule,
      yaml,
      context: contexts.exportContext(),
    })

    expect(xml).toEqual({ Attribute: [source.Attribute] })
  })

})

function roundTripFixture(fixture: string, withReference: boolean): { expected: string; result: string } {
  const expected = readFormAttributeFixture(fixture)
  const parsed = importContentFromXML<Record<string, unknown>>(expected, {
    preserveEmptyElements: true,
    preserveXsiNil: true,
  })
  const contexts = createDirectRoundTripContexts({
    logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
  })
  const imported = testPropertyFromXMLToYAML({
    context: contexts.importContext,
    rule,
    xml: parsed,
  })
  const exportContext = contexts.exportContext()
  const converted = testPropertyFromYAMLToXML({
    context: exportContext,
    referenceXML: withReference ? parsed : undefined,
    rule,
    yaml: imported.yaml,
  })
  return { expected, result: withoutDeclaration(xmlExport(converted.xml, false)) }
}

function readFormAttributeFixture(fixture: string): string {
  return fs.readFileSync(fileURLToPath(new URL(`__fixtures__/${fixture}`, import.meta.url)), "utf8")
}

function withoutDeclaration(xml: string): string {
  return xml.replace(/^\uFEFF?<\?xml[^>]+>\s*/, "").trim()
}
