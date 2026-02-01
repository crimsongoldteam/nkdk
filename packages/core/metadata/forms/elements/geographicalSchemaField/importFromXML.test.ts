import { describe, expect, it } from "vitest"
import {
  fullGeographicalSchemaField,
  minimalGeographicalSchemaField,
} from "~/tests/fixtures/forms/geographicalSchemaField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importGeographicalSchemaFieldFromXML } from "./importFromXML"
import { GeographicalSchemaFieldXML } from "./types"

describe("importGeographicalSchemaFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importGeographicalSchemaFieldFromXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ GeographicalSchemaField: GeographicalSchemaFieldXML }>(
      "forms/geographicalSchemaField/full.xml"
    )

    const result = importGeographicalSchemaFieldFromXML(mockContext, xmlData.GeographicalSchemaField)

    expect(result).toEqual(fullGeographicalSchemaField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ GeographicalSchemaField: GeographicalSchemaFieldXML }>(
      "forms/geographicalSchemaField/minimal.xml"
    )

    const result = importGeographicalSchemaFieldFromXML(mockContext, xmlData.GeographicalSchemaField)

    expect(result).toEqual(minimalGeographicalSchemaField)
  })
})
