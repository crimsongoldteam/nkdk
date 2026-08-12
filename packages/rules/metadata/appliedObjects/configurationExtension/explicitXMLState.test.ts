import { describe, expect, it } from "vitest"
import {
  decodeExplicitXMLPropertyState,
  encodeExplicitXMLPropertyState,
  isExplicitXMLPropertyState,
} from "./explicitXMLState"

describe("explicit XML PropertyState carrier", () => {
  it("отличает переносчик PropertyState от обычного !xml", () => {
    expect(isExplicitXMLPropertyState("!xml")).toBe(false)
    expect(isExplicitXMLPropertyState("!xml обычное-значение")).toBe(false)
    expect(isExplicitXMLPropertyState(encodeExplicitXMLPropertyState({
      itemType: "MetadataCatalog",
      propertyKey: "hierarchical",
      propertyXML: true,
      propertyStateXML: { "xr:Property": "Hierarchical", "xr:State": "Extended" },
    }))).toBe(true)
  })

  it("round-trips a versioned payload", () => {
    const encoded = encodeExplicitXMLPropertyState({
      itemType: "MetadataCatalog",
      propertyKey: "comment",
      propertyXML: "исходное",
      propertyStateXML: { "xr:Property": "Comment", "xr:State": "Extended" },
    })
    expect(decodeExplicitXMLPropertyState(encoded, {
      itemType: "MetadataCatalog", propertyKey: "comment",
    })).toEqual({
      version: 1,
      itemType: "MetadataCatalog",
      propertyKey: "comment",
      propertyXML: "исходное",
      propertyStateXML: { "xr:Property": "Comment", "xr:State": "Extended" },
    })
  })

  it("rejects a carrier moved to another property", () => {
    const encoded = encodeExplicitXMLPropertyState({
      itemType: "MetadataCatalog", propertyKey: "comment", propertyXML: "x",
      propertyStateXML: { "xr:Property": "Comment", "xr:State": "Extended" },
    })
    expect(() => decodeExplicitXMLPropertyState(encoded, {
      itemType: "MetadataCatalog", propertyKey: "synonym",
    })).toThrow("не соответствует свойству")
  })

  it.each([
    ["!xml configurationExtensionPropertyStateXML:not-json", "Повреждён payload"],
    [
      `!xml configurationExtensionPropertyStateXML:${Buffer.from(JSON.stringify({ version: 2 }), "utf8").toString("base64url")}`,
      "Неподдерживаемая версия",
    ],
  ])("rejects an invalid carrier", (encoded, message) => {
    expect(() => decodeExplicitXMLPropertyState(encoded, {
      itemType: "MetadataCatalog",
      propertyKey: "comment",
    })).toThrow(message)
  })
})
