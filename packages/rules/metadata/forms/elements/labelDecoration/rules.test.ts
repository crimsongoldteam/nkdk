import { describe, expect, it } from "vitest"
import {
  createDirectRoundTripContexts,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
} from "../../../../tests/directConversion"
import { LabelDecorationRules } from "./rules"
import { EMPTY_XML_TAG_VALUE, yamlScalarTagAt } from "@nkdk/runtime"

describe("LabelDecoration rules", () => {
  it("сохраняет пустой форматированный заголовок в YAML и восстанавливает без reference XML", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "ОбщаяФорма.Поиск.Элемент.Надпись",
    })
    const source = {
      _name: "Надпись",
      _id: "1",
      Title: { _formatted: "true" },
    }
    const { yaml } = testMetadataItemFromXMLToYAML({
      rule: LabelDecorationRules,
      xml: source,
      context: contexts.importContext,
      name: "Надпись",
    })

    expect(yaml).toHaveProperty("Заголовок", EMPTY_XML_TAG_VALUE)
    expect(yamlScalarTagAt(yaml, "Заголовок")).toBe("xml")

    const { xml } = testMetadataItemFromYAMLToXML({
      rule: LabelDecorationRules,
      yaml,
      context: contexts.exportContext(),
      name: "Надпись",
    })
    expect(xml.Title).toEqual({ _formatted: "true" })
  })
})
