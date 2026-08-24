import { describe, expect, it } from "vitest"
import { testPropertyFromXMLToYAML } from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../ruleRuntime"
import { MetadataFunctionalOptionRules } from "./rules"

const rule = {
  itemType: "MetadataFunctionalOptionContentProbe",
  properties: {
    content: MetadataFunctionalOptionRules.properties.content,
  },
} satisfies MetadataItemRule

const locationRule = {
  itemType: "MetadataFunctionalOptionLocationProbe",
  properties: { location: MetadataFunctionalOptionRules.properties.location },
} satisfies MetadataItemRule

describe("MetadataFunctionalOption: единый XML → YAML-обход", () => {
  it("сохраняет неподдерживаемую ссылку состава для последующей валидации", () => {
    const result = testPropertyFromXMLToYAML({
      rule,
      xml: { Properties: { Content: { "xr:Object": ["CommonTemplate.ПечатнаяФорма"] } } },
    })

    expect(result.yaml).toEqual({ СоставФункциональнойОпции: ["CommonTemplate.ПечатнаяФорма"] })
  })

  it.each([
    ["Constant.КонстантаБулево", "Константа.КонстантаБулево"],
    ["Catalog.Товары.Attribute.ИспользоватьОпцию", "Справочник.Товары.Реквизит.ИспользоватьОпцию"],
    ["InformationRegister.Настройки.Resource.ИспользоватьОпцию", "РегистрСведений.Настройки.Ресурс.ИспользоватьОпцию"],
  ])("переводит допустимое размещение %s", (canonical, yaml) => {
    const result = testPropertyFromXMLToYAML({
      rule: locationRule,
      xml: { Properties: { Location: canonical } },
    })

    expect(result.yaml).toEqual({ Размещение: yaml })
  })

  it.each([
    "Catalog.Товары.TabularSection.Строки.Attribute.ИспользоватьОпцию",
    "InformationRegister.Настройки.Attribute.ИспользоватьОпцию",
  ])("сохраняет недопустимое размещение %s для последующей валидации", (canonical) => {
    const result = testPropertyFromXMLToYAML({
      rule: locationRule,
      xml: { Properties: { Location: canonical } },
    })

    expect(result.yaml).toEqual({ Размещение: canonical })
  })
})
