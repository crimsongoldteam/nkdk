import { describe, expect, it } from "vitest"
import { fullGraphicalSchemaField, minimalGraphicalSchemaField } from "~/tests/fixtures/forms/graphicalSchemaField/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importGraphicalSchemaFieldFromXML } from "./importFromXML"
import { GraphicalSchemaFieldXML } from "./types"

describe("importGraphicalSchemaFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importGraphicalSchemaFieldFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ GraphicalSchemaField: GraphicalSchemaFieldXML }>("forms/graphicalSchemaField/full.xml")

    const result = importGraphicalSchemaFieldFromXML(mockСontext, xmlData.GraphicalSchemaField)

    expect(result).toEqual(fullGraphicalSchemaField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ GraphicalSchemaField: GraphicalSchemaFieldXML }>("forms/graphicalSchemaField/minimal.xml")

    const result = importGraphicalSchemaFieldFromXML(mockСontext, xmlData.GraphicalSchemaField)

    expect(result).toEqual(minimalGraphicalSchemaField)
  })
})

