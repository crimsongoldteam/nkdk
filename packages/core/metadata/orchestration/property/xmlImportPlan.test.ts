import { describe, expect, it, vi } from "vitest"

import type { MetadataItemRule } from "./types"
import { getXMLImportPlan, visitXMLImportPlan } from "./xmlImportPlan"

const rule = {
  itemType: "TestXMLPlan",
  properties: {
    name: { type: "string", xml: "Name", xmlAliases: ["LegacyName"] },
    attributes: { type: "string", xml: "Attributes" },
    appearance: {
      type: "string",
      xml: "Appearance",
      xmlParents: ["Attributes"],
    },
    fallback: { type: "string", xml: "Fallback", defaultValue: "value" },
    external: { type: "string", filePath: "Ext/Value.xml" },
  },
} as MetadataItemRule

describe("XML import plan", () => {
  it("visits aliases and nested XML containers once in XML order", () => {
    const visit = vi.fn()

    visitXMLImportPlan({
      plan: getXMLImportPlan({ rule, includeAllTags: true }),
      xml: {
        Unknown: "ignored",
        LegacyName: "name",
        Attributes: { Appearance: "appearance" },
      },
      visit,
    })

    expect(visit.mock.calls.map(([match]) => [match.propertyKey, match.xmlPath, match.xmlValue])).toEqual([
      ["name", ["LegacyName"], "name"],
      ["attributes", ["Attributes"], { Appearance: "appearance" }],
      ["appearance", ["Attributes", "Appearance"], "appearance"],
    ])
  })

  it("caches plans and keeps only explicit defaults", () => {
    const first = getXMLImportPlan({ rule, includeAllTags: true })
    const second = getXMLImportPlan({ rule, includeAllTags: true })

    expect(second).toBe(first)
    expect(first.defaults.map(({ propertyKey }) => propertyKey)).toEqual(["fallback"])
    expect(first.entriesByPropertyKey.get("external")?.propertyKey).toBe("external")
  })

  it("filters entries by source tags", () => {
    const taggedRule = {
      itemType: "TestTaggedPlan",
      properties: {
        body: { type: "string", xml: "Value", tag: "Body" },
        metadata: { type: "string", xml: "Value", tag: "Metadata" },
      },
    } as MetadataItemRule
    const visit = vi.fn()

    visitXMLImportPlan({
      plan: getXMLImportPlan({ rule: taggedRule, tags: ["Body"], includeAllTags: false }),
      xml: { Value: "body" },
      visit,
    })

    expect(visit.mock.calls.map(([match]) => match.propertyKey)).toEqual(["body"])
  })

  it("rejects two properties with the same XML path", () => {
    const conflictingRule = {
      itemType: "TestConflict",
      properties: {
        first: { type: "string", xml: "Value" },
        second: { type: "string", xmlAliases: ["Value"] },
      },
    } as MetadataItemRule

    expect(() => getXMLImportPlan({ rule: conflictingRule, includeAllTags: true })).toThrow(
      "XML-путь /Value соответствует свойствам first и second"
    )
  })
})
