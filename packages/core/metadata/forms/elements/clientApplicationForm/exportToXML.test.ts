import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/inputField/exportToXML"
import "~/metadata/forms/elements/usualGroup/exportToXML"
import { fullClientApplicationForm, minimalClientApplicationForm } from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportClientApplicationFormToXML } from "./exportToXML"

describe("exportClientApplicationFormToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportClientApplicationFormToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/clientApplicationForm/full.xml")
    const xmlData = exportClientApplicationFormToXML(mockСontext, fullClientApplicationForm)

    const result = xmlExport({ Form: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/clientApplicationForm/minimal.xml")
    const xmlData = exportClientApplicationFormToXML(mockСontext, minimalClientApplicationForm)

    const result = xmlExport({ Form: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
