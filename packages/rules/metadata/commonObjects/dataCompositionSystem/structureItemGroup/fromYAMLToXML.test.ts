import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../../tests/directConversion"
import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../../tests/directConversion"
import { fixtureDynamicListStructureItemGroupYAML } from "./__fixtures__/data"
import type { MetadataItemRule } from "../../../ruleRuntime"

import "./types"

describe("StructureItemGroup YAML → XML", () => {
  it("imports full fixture and exports dynamicList.xml", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "StructureItemGroup",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
      fixture: "dynamicList.xml",
      yaml: { Значение: fixtureDynamicListStructureItemGroupYAML },
    })

    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("восстанавливает вложенную структуру из снимка без reference XML", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "StructureItemGroup",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
      fixture: "dynamicList.xml",
      yaml: { Значение: fixtureDynamicListStructureItemGroupYAML },
      withReference: false,
    })

    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("строит структуру по линейному YAML без порядка из снимка", () => {
    const rule = {
      itemType: "StructureItemGroupProbe",
      properties: {
        value: {
          type: "StructureItemGroup",
          yaml: "Группировка",
          xml: "dcsset:item",
          configurationIndexAddressing: "yamlPath",
        },
      },
    } as const satisfies MetadataItemRule
    const group = (field: string) => ({
      "_xsi:type": "dcsset:StructureItemGroup",
      "dcsset:groupItems": {
        "dcsset:item": {
          "_xsi:type": "dcsset:GroupItemField",
          "dcsset:field": field,
        },
      },
    })
    const source = {
      ...group("Корень"),
      "dcsset:item": [group("Левый"), group("Правый")],
    }
    const contexts = createDirectRoundTripContexts({ logicalAddress: "Test.Structure" })
    const imported = testPropertyFromXMLToYAML({
      rule,
      context: contexts.importContext,
      xml: { "dcsset:item": source },
    })
    expect(imported.yaml).toEqual({ Группировка: ["Корень", "Левый", "Правый"] })
    const fragment = contexts.importContext.fromXML.configurationIndex?.collector.fragment("Тест.yaml")
    expect(JSON.stringify(fragment?.entities)).not.toMatch(/aliases|excludedEqualName|userSettingsId|order|present/)
    const restored = testPropertyFromYAMLToXML({
      rule,
      yaml: imported.yaml,
      context: contexts.exportContext(),
    })

    expect(restored.xml["dcsset:item"]).toMatchObject({
      "dcsset:item": {
        "dcsset:groupItems": { "dcsset:item": [{ "dcsset:field": "Левый" }] },
        "dcsset:item": {
          "dcsset:groupItems": { "dcsset:item": [{ "dcsset:field": "Правый" }] },
        },
      },
    })
  })
})

const normalize = (value: string): string =>
  value
    .replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "")
    .replace(/\r\n/g, "\n")
    .trim()
