import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullTrackBarField, minimalTrackBarField } from "~/tests/fixtures/forms/trackBarField/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportTrackBarFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/trackBarField/full.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: fullTrackBarField })

    const result = xmlExport({ TrackBarField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/trackBarField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalTrackBarField })

    const result = xmlExport({ TrackBarField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
