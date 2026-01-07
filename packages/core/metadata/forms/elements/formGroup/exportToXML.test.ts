import { describe, expect, it } from "vitest"
import { fullFormGroup, minimalFormGroup } from "~/tests/fixtures/forms/formGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFormGroupToXML } from "./exportToXML"

describe("exportFormGroupToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFormGroupToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/formGroup/full.xml")
    const xmlData = exportFormGroupToXML(mockСontext, fullFormGroup)

    const result = xmlExport({ FormGroup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/formGroup/minimal.xml")
    const xmlData = exportFormGroupToXML(mockСontext, minimalFormGroup)

    const result = xmlExport({ FormGroup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

