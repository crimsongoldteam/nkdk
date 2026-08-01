import fs from "fs"
import { fileURLToPath } from "url"
import { beforeAll, describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../../tests/directConversion"
import { importContentFromXML } from "../../../../xml/import/importer"
import { xmlExport } from "../../../../xml/export/exporter"
import type { MetadataItemRule } from "../../../orchestration/property/types"
import { exportFormAttributesToJSONSchema } from "./toJSONSchema"

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
  let strictSchema = ""

  beforeAll(() => {
    strictSchema = JSON.stringify(
      exportFormAttributesToJSONSchema({
        context: {} as Parameters<typeof exportFormAttributesToJSONSchema>[0]["context"],
        rule: { type: "FormAttributes" },
        value: undefined,
      })
    )
  })

  it.each(fixtures)("сохраняет %s", (fixture) => {
    const expected = fs.readFileSync(fileURLToPath(new URL(`__fixtures__/${fixture}`, import.meta.url)), "utf8")
    const parsed = importContentFromXML<Record<string, unknown>>(expected, {
      preserveEmptyElements: true,
      preserveXsiNil: true,
    })
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const yaml = testPropertyFromXMLToYAML({
      rule,
      xml: parsed,
      context: contexts.importContext,
    }).yaml
    const { xml } = testPropertyFromYAMLToXML({
      rule,
      yaml,
      referenceXML: parsed,
      context: contexts.exportContext(),
    })

    expect(withoutDeclaration(xmlExport(xml, false))).toBe(expected.trim())
  })

  it.each(settingsFixtures)("восстанавливает %s без reference XML", (fixture) => {
    const expected = fs.readFileSync(fileURLToPath(new URL(`__fixtures__/${fixture}`, import.meta.url)), "utf8")
    const parsed = importContentFromXML<Record<string, unknown>>(expected, {
      preserveEmptyElements: true,
      preserveXsiNil: true,
    })
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const yaml = testPropertyFromXMLToYAML({
      rule,
      xml: parsed,
      context: contexts.importContext,
    }).yaml
    const { xml } = testPropertyFromYAMLToXML({
      rule,
      yaml,
      context: contexts.exportContext(),
    })
    expect(withoutDeclaration(xmlExport(xml, false))).toBe(expected.trim())
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
            AdditionalColumns: {
              _table: "Таблица.Данные",
              Column: { _name: "Дополнительная", Type: { "v8:Type": "xs:boolean" } },
            },
          },
        },
      },
    })

    expect(yaml).toMatchObject({
      Значение: {
        Таблица: {
          Колонки: { Обычная: expect.any(Object) },
          ДополнительныеКолонки: {
            "Таблица.Данные": { Дополнительная: expect.any(Object) },
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

  it("сохраняет строгую схему всех специальных настроек", () => {
    for (const property of [
      "Колонки",
      "ДополнительныеКолонки",
      "Диаграмма",
      "ДиаграммаГанта",
      "ГрафическаяСхема",
      "ТабличныйДокумент",
      "Планировщик",
    ]) {
      expect(strictSchema).toContain(`"${property}"`)
    }
    expect(strictSchema).toContain('"additionalProperties":false')
  })
})

function withoutDeclaration(xml: string): string {
  return xml.replace(/^\uFEFF?<\?xml[^>]+>\s*/, "").trim()
}
