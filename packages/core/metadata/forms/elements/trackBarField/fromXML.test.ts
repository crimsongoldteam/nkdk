import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullTrackBarField, minimalTrackBarField } from "~/metadata/forms/elements/trackBarField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importTrackBarFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "TrackBarField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ TrackBarField: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "TrackBarField",
      xml: xmlData.TrackBarField,
    })

    expect(result).toEqual(fullTrackBarField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ TrackBarField: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "TrackBarField",
      xml: xmlData.TrackBarField,
    })

    expect(result).toEqual(minimalTrackBarField)
  })
})
