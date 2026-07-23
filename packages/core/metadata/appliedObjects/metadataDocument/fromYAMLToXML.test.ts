import { describeAppliedObjectYAMLToXMLFixtures } from "../../../tests/appliedObject/unifiedFixtureConversion"
import { MetadataDocumentRules } from "./rules"
import { fullYAML } from "./__fixtures__/full"
import { minimalYAML } from "./__fixtures__/minimal"
import { withNumeratorYAML } from "./__fixtures__/withNumerator"
import { describe, expect, it } from "vitest"
import { testMetadataItemFromYAMLToXML } from "../../../tests/directConversion"

const cases = [
  { fixture: "full.xml", yaml: fullYAML },
  { fixture: "minimal.xml", yaml: minimalYAML },
  { fixture: "withNumerator.xml", yaml: withNumeratorYAML },
] as const

describeAppliedObjectYAMLToXMLFixtures({
  itemType: "MetadataDocument",
  rule: MetadataDocumentRules,
  importMetaUrl: import.meta.url,
  cases,
  testTitle: "exports $fixture exactly",
})

describe("MetadataDocument YAML restrictions", () => {
  it("accepts common basedOn objects and rejects unsupported roots", () => {
    const result = testMetadataItemFromYAMLToXML({
      rule: MetadataDocumentRules,
      name: "ЗаказПокупателя",
      yaml: { ВводитсяНаОсновании: ["Справочник.Номенклатура"] },
    })

    expect(JSON.stringify(result.xml)).toContain("Catalog.Номенклатура")
    expect(() =>
      testMetadataItemFromYAMLToXML({
        rule: MetadataDocumentRules,
        name: "ЗаказПокупателя",
        yaml: { ВводитсяНаОсновании: ["Перечисление.Статусы"] },
      })
    ).toThrow('Вид цели "Enum" не разрешён')
  })
})
