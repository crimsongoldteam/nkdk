import { describeAppliedObjectYAMLToXMLFixtures } from "../../../tests/appliedObject/unifiedFixtureConversion"
import { describe, expect, it } from "vitest"
import { serializeDirectXML, testMetadataItemFromYAMLToXML } from "../../../tests/directConversion"
import { MetadataReportRules } from "./rules"
import { minimalYAML } from "./__fixtures__/minimal"

const cases = [{ fixture: "minimal.xml", yaml: minimalYAML }] as const

describeAppliedObjectYAMLToXMLFixtures({
  itemType: "MetadataReport",
  rule: MetadataReportRules,
  importMetaUrl: import.meta.url,
  cases,
  testTitle: "exports $fixture exactly",
  knownXMLDefaults: { includeAttributeFillValue: false },
})

describe("MetadataReport child defaults", () => {
  it("exports defaults only for supported nested attribute fields", () => {
    const exported = testMetadataItemFromYAMLToXML({
      rule: MetadataReportRules,
      name: "Проверка",
      yaml: {
        Реквизиты: { Верхний: { Тип: "Строка" } },
        ТабличныеЧасти: { Строки: { Реквизиты: { Вложенный: { Тип: "Строка" } } } },
      },
    })
    const result = serializeDirectXML(exported.xml)
    const [topAttribute = "", nestedAttribute = ""] = result.split("<Attribute").slice(1)

    expect(topAttribute).not.toMatch(/<(Indexing|FullTextSearch|DataHistory|FillFromFillingValue|FillValue)>/)
    expect(result).not.toContain("<LineNumberLength>")
    expect(nestedAttribute).toContain("<FillFromFillingValue>false</FillFromFillingValue>")
    expect(nestedAttribute).toContain('<FillValue xsi:nil="true"/>')
    expect(nestedAttribute).not.toMatch(/<(Indexing|FullTextSearch|DataHistory)>/)
  })
})
