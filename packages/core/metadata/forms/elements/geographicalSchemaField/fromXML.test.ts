import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import {
  fullGeographicalSchemaField,
  minimalGeographicalSchemaField,
} from "~/tests/fixtures/forms/geographicalSchemaField/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importGeographicalSchemaFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "GeographicalSchemaField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ GeographicalSchemaField: ElementXML }>(
      "forms/geographicalSchemaField/full.xml"
    )

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "GeographicalSchemaField",
      xml: xmlData.GeographicalSchemaField,
    })

    expect(result).toEqual(fullGeographicalSchemaField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ GeographicalSchemaField: ElementXML }>(
      "forms/geographicalSchemaField/minimal.xml"
    )

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "GeographicalSchemaField",
      xml: xmlData.GeographicalSchemaField,
    })

    expect(result).toEqual(minimalGeographicalSchemaField)
  })
})
