import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullGraphicalSchemaField, minimalGraphicalSchemaField } from "~/tests/fixtures/forms/graphicalSchemaField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importGraphicalSchemaFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.GraphicalSchemaField,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ GraphicalSchemaField: ElementXML }>("forms/graphicalSchemaField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.GraphicalSchemaField,
      xml: xmlData.GraphicalSchemaField,
    })

    expect(result).toEqual(fullGraphicalSchemaField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ GraphicalSchemaField: ElementXML }>("forms/graphicalSchemaField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.GraphicalSchemaField,
      xml: xmlData.GraphicalSchemaField,
    })

    expect(result).toEqual(minimalGraphicalSchemaField)
  })
})
