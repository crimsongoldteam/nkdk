import { describe, expect, it } from "vitest"
import { fullTrackBarField, minimalTrackBarField } from "~/tests/fixtures/forms/trackBarField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importTrackBarFieldFromXML } from "./importFromXML"
import { TrackBarFieldXML } from "./types"

describe("importTrackBarFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importTrackBarFieldFromXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ TrackBarField: TrackBarFieldXML }>("forms/trackBarField/full.xml")

    const result = importTrackBarFieldFromXML(mockContext, xmlData.TrackBarField)

    expect(result).toEqual(fullTrackBarField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ TrackBarField: TrackBarFieldXML }>("forms/trackBarField/minimal.xml")

    const result = importTrackBarFieldFromXML(mockContext, xmlData.TrackBarField)

    expect(result).toEqual(minimalTrackBarField)
  })
})
