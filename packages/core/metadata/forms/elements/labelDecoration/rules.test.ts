import { describe, expect, it } from "vitest"
import {
  createDirectRoundTripContexts,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
} from "../../../../tests/directConversion"
import { LabelDecorationRules } from "./rules"

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

    expect(yaml).toMatchObject({
      Заголовок: {
        Форматированный: "Истина",
        Текст: "",
      },
    })

    const { xml } = testMetadataItemFromYAMLToXML({
      rule: LabelDecorationRules,
      yaml,
      context: contexts.exportContext(),
      name: "Надпись",
    })
    expect(xml.Title).toEqual({ _formatted: true })
  })
})
