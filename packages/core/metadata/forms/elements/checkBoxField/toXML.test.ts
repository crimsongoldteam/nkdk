import { describe, expect, it } from "vitest"
import { exportElementToXML, ToMetadata } from "~/metadata/orchestration"
import { fullCheckBoxField, minimalCheckBoxField } from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { setIdsToElements } from "../../clientApplicationForm/toXML"

describe("exportCheckBoxFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/checkBoxField/full.xml")

    const referenceElement = { id: "1" } as ToMetadata<"CheckBoxField">

    const context = mockContextToXML()
    const xmlData = exportElementToXML({
      context,
      element: fullCheckBoxField as ToMetadata<"CheckBoxField">,
      referenceElement,
    })

    setIdsToElements(context)

    const result = xmlExport({ CheckBoxField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/checkBoxField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalCheckBoxField })

    const result = xmlExport({ CheckBoxField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
