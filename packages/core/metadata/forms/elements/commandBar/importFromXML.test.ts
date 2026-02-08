import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullCommandBar, minimalCommandBar } from "~/tests/fixtures/forms/commandBar/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importCommandBarFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.CommandBar,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ CommandBar: ElementXML }>("forms/commandBar/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.CommandBar,
      xml: xmlData.CommandBar,
    })

    expect(result).toEqual(fullCommandBar)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ CommandBar: ElementXML }>("forms/commandBar/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.CommandBar,
      xml: xmlData.CommandBar,
    })

    expect(result).toEqual(minimalCommandBar)
  })
})
