import fs from "fs"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"

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
] as const

describe("FormAttributes XML → YAML → XML", () => {
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
    const json = JSON.stringify(
      exportFormAttributesToJSONSchema({
        context: {} as Parameters<typeof exportFormAttributesToJSONSchema>[0]["context"],
        rule: { type: "FormAttributes" },
        value: undefined,
      })
    )

    for (const property of [
      "Колонки",
      "ДополнительныеКолонки",
      "Диаграмма",
      "ДиаграммаГанта",
      "ГрафическаяСхема",
      "ТабличныйДокумент",
      "Планировщик",
    ]) {
      expect(json).toContain(`"${property}"`)
    }
    expect(json).toContain('"additionalProperties":false')
  })
})

function withoutDeclaration(xml: string): string {
  return xml.replace(/^\uFEFF?<\?xml[^>]+>\s*/, "").trim()
}
