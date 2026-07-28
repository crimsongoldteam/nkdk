import { describe, expect, it } from "vitest"
import { fingerprintMetadataItemRule } from "./fingerprint"

describe("fingerprintMetadataItemRule", () => {
  it("учитывает xmlOrder", () => {
    expect(
      fingerprintMetadataItemRule({
        itemType: "TestItem" as never,
        xmlOrder: ["name", "value"],
        properties: { name: { type: "string" }, value: { type: "string" } },
      })
    ).not.toBe(
      fingerprintMetadataItemRule({
        itemType: "TestItem" as never,
        xmlOrder: ["value", "name"],
        properties: { name: { type: "string" }, value: { type: "string" } },
      })
    )
  })

  it("distinguishes equal itemType with different XML mapping", () => {
    const canonical = {
      itemType: "TestItem" as never,
      properties: { name: { type: "string", xml: "Name" } },
    }
    const legacy = {
      itemType: "TestItem" as never,
      properties: { name: { type: "string", xml: "LegacyName" } },
    }
    expect(fingerprintMetadataItemRule(canonical)).not.toBe(fingerprintMetadataItemRule(legacy))
  })

  it("is stable when object key insertion order differs", () => {
    const left = {
      itemType: "TestItem" as never,
      properties: {
        name: { type: "string", xml: "Name" },
        value: { type: "string", xml: "Value" },
      },
    }
    const right = {
      properties: {
        value: { xml: "Value", type: "string" },
        name: { xml: "Name", type: "string" },
      },
      itemType: "TestItem" as never,
    }
    expect(fingerprintMetadataItemRule(left)).toBe(fingerprintMetadataItemRule(right))
  })

  it("is stable across different runtime compilations of functions", () => {
    const left = {
      itemType: "TestItem" as never,
      properties: { value: { type: "string", toXML: () => true } },
    }
    const right = {
      itemType: "TestItem" as never,
      properties: { value: { type: "string", toXML: () => false } },
    }
    expect(fingerprintMetadataItemRule(left)).toBe(fingerprintMetadataItemRule(right))
  })
})
