import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

import { testMetadataItemFromYAMLToXML } from "../../../tests/directConversion"
import { MetadataRegisterDimensionRules } from "../metadataRegisterDimension/rules"
import { analyzeMetadataAttributeFillValue } from "./analyzeItem"

const representativeItemTypes = [
  "MetadataRegisterDimension",
  "MetadataCommonAttribute",
  "AccountingFlag",
  "MetadataExternalDataSourceCubeResource",
] as const

describe("FillValue обычных полей", () => {
  it.each(representativeItemTypes)("разрешает строковый !xml/value Nil у %s", (itemType) => {
    expect(analyze(itemType, "Тип: Строка\nЗначениеЗаполнения: !xml/value Nil\n").diagnostics).toEqual([])
  })

  it.each(representativeItemTypes)("отклоняет !xml/value Nil у булевого %s", (itemType) => {
    expect(analyze(itemType, "Тип: Булево\nЗначениеЗаполнения: !xml/value Nil\n").diagnostics[0]?.message)
      .toBe("Nil допустим только для обычного строкового реквизита")
  })

  it.each(representativeItemTypes)("отклоняет !xml/value Nil у составного %s", (itemType) => {
    expect(analyze(itemType, "Тип: [Строка, Булево]\nЗначениеЗаполнения: !xml/value Nil\n").diagnostics[0]?.message)
      .toBe("Nil допустим только для обычного строкового реквизита")
  })

  it("экспортирует !xml/value Nil измерения регистра как xsi:nil без reference", () => {
    const parsed = parseMetadataYaml("Тип: Строка\nЗначениеЗаполнения: !xml/value Nil\n")
    const { xml } = testMetadataItemFromYAMLToXML({
      rule: MetadataRegisterDimensionRules,
      yaml: parsed.data,
      name: "Поле",
    })

    expect(xml).toMatchObject({ Properties: { FillValue: { "_xsi:nil": true } } })
  })

  it("экспортирует отсутствующее значение строкового измерения как xs:string", () => {
    const { xml } = testMetadataItemFromYAMLToXML({
      rule: MetadataRegisterDimensionRules,
      yaml: { Тип: "Строка" },
      name: "Поле",
    })

    expect(xml).toMatchObject({ Properties: { FillValue: { "_xsi:type": "xs:string" } } })
  })
})

function analyze(itemType: string, text: string) {
  const parsed = parseMetadataYaml(text)
  const item = parsed.data as Record<string, unknown>
  return analyzeMetadataAttributeFillValue({
    itemType,
    item,
    itemYamlPath: ["Поля", "Поле"],
    rootYaml: {},
    rootRule: { itemType: "Probe", properties: {} } satisfies MetadataItemRule,
    owner: { dir: "РегистрСведений", name: "Проба" },
    filePath: "Проба.yaml",
    parsed,
  })
}
