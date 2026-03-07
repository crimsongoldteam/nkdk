import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullDendrogramField, minimalDendrogramField } from "~/tests/fixtures/forms/dendrogramField/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportDendrogramFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/dendrogramField/full.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: fullDendrogramField })

    const result = xmlExport({ DendrogramField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/dendrogramField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalDendrogramField })

    const result = xmlExport({ DendrogramField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
