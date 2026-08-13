import { describeAppliedObjectYAMLToXMLFixtures } from "../../../tests/appliedObject/unifiedFixtureConversion"
import { describe, expect, it } from "vitest"
import { testMetadataItemFromYAMLToXML } from "../../../tests/directConversion"
import { serializeDirectXML } from "../../../tests/directConversion"
import { MetadataEventSubscriptionRules } from "./rules"
import { fullYAML } from "./__fixtures__/full"
import { minimalYAML } from "./__fixtures__/minimal"

const cases = [
  { fixture: "full.xml", yaml: fullYAML },
  { fixture: "minimal.xml", yaml: minimalYAML },
] as const

describeAppliedObjectYAMLToXMLFixtures({
  itemType: "MetadataEventSubscription",
  rule: MetadataEventSubscriptionRules,
  importMetaUrl: import.meta.url,
  cases,
  testTitle: "exports $fixture exactly",
})

describe("MetadataEventSubscription YAML → XML", () => {
  it("writes a new single Source canonically and keeps 1C field order", () => {
    const converted = testMetadataItemFromYAMLToXML({
      rule: MetadataEventSubscriptionRules,
      name: "ПодпискаНаСобытиеНовая",
      yaml: {
        Источник: "ДокументОбъект.ЗаказКлиента",
        Событие: "BeforeWrite",
        Обработчик: "CommonModule.ОбщийМодульПодпискаНаСобытие.ПередЗаписьюЗаказаКлиента",
      },
    })
    const result = serializeDirectXML(converted.xml)
    const properties = result.match(/<Properties>([\s\S]*?)<\/Properties>/)?.[1] ?? ""
    const names = Array.from(properties.matchAll(/<([A-Za-z]+)(?:>|\/>)/g), ([, name]) => name)

    expect(result).toContain("<Source>")
    expect(result).toContain("<v8:Type>cfg:DocumentObject.ЗаказКлиента</v8:Type>")
    expect(result).not.toContain("v8:TypeSet")
    expect(names).toEqual(["Name", "Synonym", "Comment", "Source", "Event", "Handler"])
  })
})
