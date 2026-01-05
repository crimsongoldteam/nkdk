import { describe, expect, it } from "vitest"
import { fullInputField } from "~/tests/fixtures/forms/inputField/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportInputFieldToXML } from "./exportToXML"

describe("exportInputFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/inputField/full.xml")
    const xmlData = exportInputFieldToXML(mockСontext, fullInputField)

    const result = xmlExport({ InputField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
