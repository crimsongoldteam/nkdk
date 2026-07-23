import { describeAppliedObjectXMLToYAMLFixtures } from "../../../tests/appliedObject/unifiedFixtureConversion"
import { MetadataDocumentRules } from "./rules"
import { fullYAML } from "./__fixtures__/full"
import { minimalYAML } from "./__fixtures__/minimal"
import { withNumeratorYAML } from "./__fixtures__/withNumerator"
import { describe, expect, it } from "vitest"
import { testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"

const cases = [
  { fixture: "full.xml", yaml: fullYAML },
  { fixture: "minimal.xml", yaml: minimalYAML },
  { fixture: "withNumerator.xml", yaml: withNumeratorYAML },
] as const

describeAppliedObjectXMLToYAMLFixtures({
  itemType: "MetadataDocument",
  rule: MetadataDocumentRules,
  importMetaUrl: import.meta.url,
  cases,
  testTitle: "exports $fixture directly to YAML",
})

describe("MetadataDocument external choice form", () => {
  it("exports document journal choice form as an external form reference", () => {
    const result = testMetadataItemFromXMLToYAML({
      rule: MetadataDocumentRules,
      name: "ВосстановлениеНДСПоОбъектамНедвижимости",
      xml: {
        Document: {
          Properties: {
            Name: "ВосстановлениеНДСПоОбъектамНедвижимости",
            DefaultChoiceForm: "DocumentJournal.РегламентныеОперацииНДС.Form.ФормаСписка",
          },
        },
      },
    })

    expect(result.yaml).toMatchObject({
      ОсновнаяФормаДляВыбора: "ЖурналДокументов.РегламентныеОперацииНДС.Форма.ФормаСписка",
    })
  })
})
