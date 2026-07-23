import { describeAppliedObjectYAMLToXMLFixtures } from "../../../tests/appliedObject/unifiedFixtureConversion"
import { describe, expect, it } from "vitest"
import {
  testAppliedObjectFromXMLToYAML,
  testAppliedObjectFromYAMLToXML,
  testMetadataItemFromYAMLToXML,
} from "../../../tests/directConversion"
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

describe("MetadataEventSubscription special YAML → XML cases", () => {
  it.each([
    ["source-typeset.xml", '<Source xsi:type="v8:TypeSet">'],
    ["source-child-typeset.xml", "<v8:TypeSet>cfg:DocumentObject.ЗаказКлиента</v8:TypeSet>"],
  ])("preserves Source TypeSet container from $fixture", (fixture, marker) => {
    const imported = testAppliedObjectFromXMLToYAML({
      rule: MetadataEventSubscriptionRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const exported = testAppliedObjectFromYAMLToXML({
      rule: MetadataEventSubscriptionRules,
      importMetaUrl: import.meta.url,
      fixture,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toMatchObject({ Источник: "ДокументОбъект.ЗаказКлиента" })
    expect(normalize(exported.result)).toBe(normalize(exported.expected))
    expect(exported.result).toContain(marker)
  })

  it("does not inherit TypeSet when Source semantics changed", () => {
    const exported = testAppliedObjectFromYAMLToXML({
      rule: MetadataEventSubscriptionRules,
      importMetaUrl: import.meta.url,
      fixture: "source-typeset.xml",
      yaml: {
        Источник: "ДокументОбъект.ДругойЗаказ",
        Событие: "BeforeWrite",
        Обработчик: "CommonModule.ОбщийМодульПодпискаНаСобытие.ПередЗаписьюЗаказаКлиента",
      },
    })

    expect(exported.result).toContain("<v8:Type>cfg:DocumentObject.ДругойЗаказ</v8:Type>")
    expect(exported.result).not.toContain("v8:TypeSet")
  })

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

function normalize(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()
}
