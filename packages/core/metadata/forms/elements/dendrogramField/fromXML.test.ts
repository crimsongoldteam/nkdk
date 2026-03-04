import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/metadataFactory"
import { fullDendrogramField, minimalDendrogramField } from "~/tests/fixtures/forms/dendrogramField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importDendrogramFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: "DendrogramField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ DendrogramField: ElementXML }>("forms/dendrogramField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "DendrogramField",
      xml: xmlData.DendrogramField,
    })

    expect(result).toEqual(fullDendrogramField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ DendrogramField: ElementXML }>("forms/dendrogramField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "DendrogramField",
      xml: xmlData.DendrogramField,
    })

    expect(result).toEqual(minimalDendrogramField)
  })
})
