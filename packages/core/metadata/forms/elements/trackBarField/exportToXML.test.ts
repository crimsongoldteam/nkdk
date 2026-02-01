import { describe, expect, it } from "vitest"
import { fullTrackBarField, minimalTrackBarField } from "~/tests/fixtures/forms/trackBarField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportTrackBarFieldToXML } from "./exportToXML"

describe("exportTrackBarFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportTrackBarFieldToXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/trackBarField/full.xml")
    const xmlData = exportTrackBarFieldToXML(mockContext, fullTrackBarField)

    const result = xmlExport({ TrackBarField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/trackBarField/minimal.xml")
    const xmlData = exportTrackBarFieldToXML(mockContext, minimalTrackBarField)

    const result = xmlExport({ TrackBarField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
