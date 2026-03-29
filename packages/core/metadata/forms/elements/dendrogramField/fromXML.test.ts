import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullDendrogramField, minimalDendrogramField } from "~/metadata/forms/elements/dendrogramField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importDendrogramFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "DendrogramField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ DendrogramField: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "DendrogramField",
      xml: xmlData.DendrogramField,
    })

    expect(result).toEqual(fullDendrogramField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ DendrogramField: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "DendrogramField",
      xml: xmlData.DendrogramField,
    })

    expect(result).toEqual(minimalDendrogramField)
  })
})
