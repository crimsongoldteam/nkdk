import fs from "fs"
import { fileURLToPath } from "url"
import { beforeAll, describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../../tests/directConversion"
import { importContentFromXML } from "@nkdk/runtime"
import { xmlExport } from "@nkdk/runtime"
import { mockContext } from "../../../../tests/mockContext"
import { exportMetadataItemToJSONSchema } from "../../../ruleRuntime/metadataItem/toJSONSchema"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { DynamicListRules } from "./rules"

import "./types"

const rule = {
  itemType: "DynamicListProbe",
  properties: {
    value: { type: "DynamicList", yaml: "Значение", xml: "Settings" },
  },
} as const satisfies MetadataItemRule

const fixtures = [
  "designTimeDataParameters.xml",
  "emptyListSettings.xml",
  "full.xml",
  "keyField.xml",
  "minimal.xml",
  "multipleCalculatedFields.xml",
  "queryTextWithManualQueryFalse.xml",
] as const

describe("DynamicList XML → YAML → XML", () => {
  let dynamicListSchema = ""

  beforeAll(() => {
    dynamicListSchema = JSON.stringify(
      exportMetadataItemToJSONSchema({ context: mockContext, rule: DynamicListRules })
    )
  })

  it.each(fixtures)("сохраняет %s", (fixture) => {
    const expected = fs.readFileSync(fileURLToPath(new URL(`__fixtures__/${fixture}`, import.meta.url)), "utf8")
    const parsed = importContentFromXML<Record<string, unknown>>(expected, {
      preserveEmptyElements: true,
      preserveXsiNil: true,
    })
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаСписка.Атрибут.Список",
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

  it.each(["full.xml", "minimal.xml", "emptyListSettings.xml"] as const)(
    "восстанавливает %s без reference XML",
    (fixture) => {
      const expected = fs.readFileSync(fileURLToPath(new URL(`__fixtures__/${fixture}`, import.meta.url)), "utf8")
      const parsed = importContentFromXML<Record<string, unknown>>(expected, {
        preserveEmptyElements: true,
        preserveXsiNil: true,
      })
      const contexts = createDirectRoundTripContexts({
        logicalAddress: "Справочник.Товары.Форма.ФормаСписка.Атрибут.Список",
      })
      const yaml = testPropertyFromXMLToYAML({ rule, xml: parsed, context: contexts.importContext }).yaml
      const { xml } = testPropertyFromYAMLToXML({ rule, yaml, context: contexts.exportContext() })
      expect(withoutDeclaration(xmlExport(xml, false))).toBe(expected.trim())
    }
  )

  it("не выводит в YAML значение ManualQuery=false по умолчанию", () => {
    const expected = fs.readFileSync(
      fileURLToPath(new URL("__fixtures__/queryTextWithManualQueryFalse.xml", import.meta.url)),
      "utf8"
    )
    const parsed = importContentFromXML<Record<string, unknown>>(expected)

    expect(testPropertyFromXMLToYAML({ rule, xml: parsed }).yaml).not.toHaveProperty("Значение.ПроизвольныйЗапрос")
  })

  it("выгружает новый список с ключевыми полями в каноническом порядке", () => {
    const { xml } = testPropertyFromYAMLToXML({
      rule,
      yaml: {
        Значение: {
          ПроизвольныйЗапрос: "Истина",
          ВидКлюча: "КлючСтроки",
          ПоляКлюча: ["КлючПриглашения", "Контрагент", "ИдентификаторОрганизации"],
          НастройкиСписка: {},
        },
      },
    })
    const result = xmlExport(xml, false)

    expect(result.indexOf("<KeyType>")).toBeGreaterThan(result.indexOf("<ManualQuery>"))
    expect(result.indexOf("<KeyField>")).toBeGreaterThan(result.indexOf("<KeyType>"))
    expect(result.indexOf("<ListSettings")).toBeGreaterThan(result.lastIndexOf("<KeyField>"))
    expect(result.match(/<KeyField>/g)).toHaveLength(3)
  })

  it("не восстанавливает Asc из reference XML без явного YAML-поля", () => {
    const yaml = {
      Значение: {
        ВычисляемыеПоля: [
          {
            ПутьКДанным: "УниверсальнаяДата",
            Выражение: "Дата",
            ВыраженияУпорядочивания: [{ Выражение: "Дата", Автоупорядочивание: "Ложь" }],
          },
        ],
      },
    }
    const referenceXML = {
      Settings: {
        "_xsi:type": "DynamicList",
        CalculatedField: {
          "dcssch:dataPath": "УниверсальнаяДата",
          "dcssch:expression": "Дата",
          "dcssch:orderExpression": {
            expression: "Дата",
            orderType: {
              "#text": "Asc",
              _xmlns: "http://v8.1c.ru/8.1/data-composition-system/common",
            },
            autoOrder: false,
          },
        },
      },
    }

    const fresh = xmlExport(testPropertyFromYAMLToXML({ rule, yaml }).xml, false)
    const restored = xmlExport(testPropertyFromYAMLToXML({ rule, yaml, referenceXML }).xml, false)

    expect(fresh).not.toContain("<orderType")
    expect(restored).not.toContain("<orderType")
  })

  it("разрешает одно или несколько строковых ключевых полей в JSON Schema", () => {
    expect(dynamicListSchema).toContain('"ПоляКлюча"')
    expect(dynamicListSchema).toContain('"type":"string"')
    expect(dynamicListSchema).toContain('"type":"array"')
    expect(dynamicListSchema).toContain('"items":{"type":"string"}')
    expect(dynamicListSchema).not.toContain('"items":{"type":"number"}')
  })
})

function withoutDeclaration(xml: string): string {
  return xml.replace(/^\uFEFF?<\?xml[^>]+>\s*/, "").trim()
}
