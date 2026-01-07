import { describe, expect, it } from "vitest"
import { fullViewStatusAddition, minimalViewStatusAddition } from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportViewStatusAdditionToXML } from "./exportToXML"

describe("exportViewStatusAdditionToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportViewStatusAdditionToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/viewStatusAddition/full.xml")
    const xmlData = exportViewStatusAdditionToXML(mockСontext, fullViewStatusAddition)

    const result = xmlExport({ ViewStatusAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/viewStatusAddition/minimal.xml")
    const xmlData = exportViewStatusAdditionToXML(mockСontext, minimalViewStatusAddition)

    const result = xmlExport({ ViewStatusAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

