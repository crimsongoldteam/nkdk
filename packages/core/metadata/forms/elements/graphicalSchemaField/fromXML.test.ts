import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullGraphicalSchemaField, minimalGraphicalSchemaField } from "~/metadata/forms/elements/graphicalSchemaField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importGraphicalSchemaFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "GraphicalSchemaField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ GraphicalSchemaField: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "GraphicalSchemaField",
      xml: xmlData.GraphicalSchemaField,
    })

    expect(result).toEqual(fullGraphicalSchemaField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ GraphicalSchemaField: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "GraphicalSchemaField",
      xml: xmlData.GraphicalSchemaField,
    })

    expect(result).toEqual(minimalGraphicalSchemaField)
  })
})
