import { describe, expect, it, vi } from "vitest"
import { createXmlImportAuditSession, parseXmlDocumentWithSaxes } from "@nkdk/runtime"

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
    implicit: { type: "string", xml: "Implicit", implicitValueXML: "xml-implicit" },
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

  it("caches plans and keeps properties synthesized for absent XML", () => {
    const first = getXMLImportPlan({ rule, includeAllTags: true })
    const second = getXMLImportPlan({ rule, includeAllTags: true })

    expect(second).toBe(first)
    expect(first.defaults.map(({ propertyKey }) => propertyKey)).toEqual(["fallback", "implicit"])
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

  it("visits every property registered for the same XML path", () => {
    const sharedRule = {
      itemType: "TestSharedXMLPath",
      properties: {
        first: { type: "string", xml: "Value" },
        second: { type: "string", xml: "Value" },
      },
    } as MetadataItemRule
    const visit = vi.fn()

    visitXMLImportPlan({
      plan: getXMLImportPlan({ rule: sharedRule, includeAllTags: true }),
      xml: { Value: "value" },
      visit,
    })

    expect(visit.mock.calls.map(([match]) => match.propertyKey)).toEqual(["first", "second"])
  })

  it("visits a property only once when canonical name and alias are both present", () => {
    const visit = vi.fn()

    visitXMLImportPlan({
      plan: getXMLImportPlan({ rule, includeAllTags: true }),
      xml: { LegacyName: "legacy", Name: "canonical" },
      visit,
    })

    expect(visit.mock.calls.filter(([match]) => match.propertyKey === "name")).toHaveLength(1)
  })

  it("не схлопывает адресные canonical, alias, singleton-повторы и неизвестные части", () => {
    const structuralRule = {
      itemType: "TestStructuralXMLPlan",
      properties: {
        name: { type: "string", xml: "Name", xmlAliases: ["LegacyName"] },
        singleton: { type: "string", xml: "Singleton" },
        knownAttribute: { type: "string", xml: "_known" },
        appearance: { type: "string", xml: "Appearance", xmlParents: ["Attributes"] },
      },
    } as MetadataItemRule
    const root = parseXmlDocumentWithSaxes(
      '<Root known="yes" future="x"><LegacyName>legacy</LegacyName><Name>canonical</Name>' +
      '<Singleton>one</Singleton><Singleton>two</Singleton>' +
      '<Attributes extra="z"><Appearance>shown</Appearance><Future/></Attributes></Root>',
    ).roots[0]!
    const audit = createXmlImportAuditSession([root])
    const visit = vi.fn()

    visitXMLImportPlan({
      plan: getXMLImportPlan({ rule: structuralRule, includeAllTags: true }),
      xml: root,
      audit,
      visit,
    })
    audit.finalize()

    expect(
      visit.mock.calls.map(([match]) => [match.propertyKey, match.xmlNode?.path, match.xmlValue]),
    ).toEqual([
      ["knownAttribute", "/Root[1]/@known[1]", "yes"],
      ["name", "/Root[1]/Name[1]", "canonical"],
      ["singleton", "/Root[1]/Singleton[1]", "one"],
      ["appearance", "/Root[1]/Attributes[1]/Appearance[1]", "shown"],
    ])
    expect(
      audit.outcomes()
        .filter(({ node }) =>
          ("type" in node && node.type === "element") || node.path.includes("/@"),
        )
        .map(({ node, state }) => [node.path, state]),
    ).toEqual([
      ["/Root[1]", "claimed"],
      ["/Root[1]/@known[1]", "claimed"],
      ["/Root[1]/@future[1]", "unknown"],
      ["/Root[1]/LegacyName[1]", "ambiguous"],
      ["/Root[1]/Name[1]", "ambiguous"],
      ["/Root[1]/Singleton[1]", "claimed"],
      ["/Root[1]/Singleton[2]", "duplicate"],
      ["/Root[1]/Attributes[1]", "claimed"],
      ["/Root[1]/Attributes[1]/@extra[1]", "unknown"],
      ["/Root[1]/Attributes[1]/Appearance[1]", "claimed"],
      ["/Root[1]/Attributes[1]/Future[1]", "unknown"],
    ])
  })
})
