import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullRadioButtonField, minimalRadioButtonField } from "~/metadata/forms/elements/radioButtonField/__fixtures__/data"
import { mockContextToXML } from "~/tests/mockContext"

import { xmlExport } from "~/xml/export/exporter"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"

describe("exportRadioButtonFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFixtureAsString(import.meta.url, "full.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: fullRadioButtonField })

    const result = xmlExport({ RadioButtonField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFixtureAsString(import.meta.url, "minimal.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalRadioButtonField })

    const result = xmlExport({ RadioButtonField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
