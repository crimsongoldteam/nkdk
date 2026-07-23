import { describe, expect, it } from "vitest"

import type {
  ExportToXMLFunctionNew,
  ExportToYAMLFunctionNew,
  ImportFromYAMLFunctionNew,
} from "../metadata/orchestration/property/fn"
import { minimalYAML } from "../metadata/appliedObjects/metadataCatalog/__fixtures__/minimal"
import { MetadataCatalogRules } from "../metadata/appliedObjects/metadataCatalog/rules"
import { PropertyRuleType } from "../metadata/orchestration/property/registry"
import { registerTypeRule } from "../metadata/orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "../metadata/orchestration/property/types"
import {
  testAppliedObjectFromXMLToYAML,
  testAppliedObjectFromYAMLToXML,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "./directConversion"

describe("direct conversion test helpers", () => {
  it("вызывает атомарные операции в порядке единого обхода", () => {
    const propertyType = "TestDirectConversionOrder" as PropertyRuleType
    const calls: string[] = []
    registerTypeRule(propertyType, "importFromXML", (_context, _rule, xml) => {
      calls.push("fromXML")
      return { parsed: String(xml) }
    })
    registerTypeRule(propertyType, "exportToYAML", (({ value }) => {
      calls.push("toYAML")
      return (value as { parsed: string }).parsed.toUpperCase()
    }) as ExportToYAMLFunctionNew)
    registerTypeRule(propertyType, "importFromYAML", (({ value }) => {
      calls.push("fromYAML")
      return String(value).toUpperCase()
    }) as ImportFromYAMLFunctionNew)
    registerTypeRule(propertyType, "exportToXML", (({ value }) => {
      calls.push("toXML")
      return `xml:${String(value)}`
    }) as ExportToXMLFunctionNew)
    const rule = itemRule(propertyType)

    const imported = testPropertyFromXMLToYAML({ rule, xml: { Value: "abc" } })
    const exported = testPropertyFromYAMLToXML({
      rule,
      yaml: { Значение: "abc" },
      externalWriteFactory: () => [{ kind: "handler", run: async () => undefined }],
    })

    expect(calls).toEqual(["fromXML", "toYAML", "fromYAML", "toXML"])
    expect(imported.yaml).toEqual({ Значение: "ABC" })
    expect(imported.indexes.dependencies).toEqual([])
    expect(imported.indexes.metadata.events).toHaveLength(1)
    expect(exported.xml).toEqual({ Value: "xml:ABC" })
    expect(exported.externalWrites).toHaveLength(1)
  })

  it("обрабатывает XMLRoot и сохраняет неизвестный reference XML", () => {
    const rule = {
      itemType: "TestDirectRoot",
      xsiType: "GeneratedType",
      properties: {
        xmlRoot: {
          type: "XMLRoot",
          container: "Item",
          rootAttributes: { _xmlns: "generated" },
          forReferenceOnly: true,
        },
        value: { type: "string", yaml: "Значение", xml: "Value" },
      },
    } as const satisfies MetadataItemRule
    const referenceXML = {
      MetaDataObject: {
        _xmlns: "reference",
        Item: { "_xsi:type": "OldType", Value: "old", Unknown: "keep" },
      },
    }

    const imported = testMetadataItemFromXMLToYAML({
      rule,
      xml: referenceXML.MetaDataObject,
    })
    const exported = testMetadataItemFromYAMLToXML({
      rule,
      yaml: { Значение: "new" },
      referenceXML,
    })

    expect(imported.yaml).toEqual({ Значение: "old" })
    expect(exported.xml).toEqual({
      MetaDataObject: {
        _xmlns: "reference",
        Item: { "_xsi:type": "GeneratedType", Value: "new", Unknown: "keep" },
      },
    })
  })

  it("читает существующую applied object fixture в обоих направлениях", () => {
    const importMetaUrl = new URL(
      "../metadata/appliedObjects/metadataCatalog/fromXMLToYAML.test.ts",
      import.meta.url
    ).href

    const imported = testAppliedObjectFromXMLToYAML({
      rule: MetadataCatalogRules,
      importMetaUrl,
      fixture: "minimal.xml",
    })
    const exported = testAppliedObjectFromYAMLToXML({
      rule: MetadataCatalogRules,
      importMetaUrl,
      fixture: "minimal.xml",
      yaml: minimalYAML,
      name: "ПоУмолчанию",
    })

    expect(imported.yaml).toEqual(minimalYAML)
    expect(exported.result).toBe(exported.expected)
  })
})

function itemRule(propertyType: PropertyRuleType): MetadataItemRule {
  return {
    itemType: "TestDirectConversion",
    properties: {
      value: { type: propertyType, yaml: "Значение", xml: "Value" },
    },
  } as MetadataItemRule
}
