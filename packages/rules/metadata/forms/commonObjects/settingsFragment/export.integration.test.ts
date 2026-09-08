import { describe, expect, it } from "vitest"
import { isXmlElementNode, xmlExport } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { testPropertyFromYAMLToXML } from "../../../../tests/directConversion"
import "../index"

describe("экспорт непрозрачных настроек", () => {
  it("передаёт разобранный фрагмент выходу без объектной копии", () => {
    const rule = { itemType: "ChartFragmentProbe", properties: {
      settings: { type: "Chart", xml: "Settings", yaml: "Настройки" },
    } } as const satisfies MetadataItemRule
    const { xml } = testPropertyFromYAMLToXML({ rule, yaml: { Настройки: '<d4p1:chartType>Column</d4p1:chartType>' } })
    expect(isXmlElementNode(xml.Settings)).toBe(true)
    expect(xmlExport(xml, false)).toBe([
      '<Settings xmlns:d4p1="http://v8.1c.ru/8.2/data/chart" xsi:type="d4p1:Chart">',
      '\t<d4p1:chartType>Column</d4p1:chartType>',
      '</Settings>',
    ].join("\n"))
  })
})
