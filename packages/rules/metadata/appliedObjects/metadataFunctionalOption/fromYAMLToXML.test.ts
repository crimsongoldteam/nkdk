import { describe, expect, it } from "vitest"
import { testPropertyFromYAMLToXML } from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../ruleRuntime"
import { MetadataFunctionalOptionRules } from "./rules"

const rule = {
  itemType: "MetadataFunctionalOptionLocationProbe",
  properties: { location: MetadataFunctionalOptionRules.properties.location },
} satisfies MetadataItemRule

describe("MetadataFunctionalOption YAML → XML", () => {
  it.each([
    ["Константа.КонстантаБулево", "Constant.КонстантаБулево"],
    ["Справочник.Товары.Реквизит.ИспользоватьОпцию", "Catalog.Товары.Attribute.ИспользоватьОпцию"],
    ["РегистрСведений.Настройки.Ресурс.ИспользоватьОпцию", "InformationRegister.Настройки.Resource.ИспользоватьОпцию"],
  ])("восстанавливает допустимое размещение %s", (yaml, canonical) => {
    const result = testPropertyFromYAMLToXML({ rule, yaml: { Размещение: yaml } })

    expect(result.xml).toEqual({ Properties: { Location: canonical } })
  })
})
