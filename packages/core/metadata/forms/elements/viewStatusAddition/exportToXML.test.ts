import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import {
  fullViewStatusAddition,
  minimalViewStatusAddition,
  parentElement,
} from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportViewStatusAdditionToXML } from "./exportToXML"

describe("exportViewStatusAdditionToXML", () => {
  it("should return all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/viewStatusAddition/full.xml")

    const xmlData = exportViewStatusAdditionToXML(mockContext, mockRule, fullViewStatusAddition, parentElement)

    const result = xmlExport({ ViewStatusAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return default when data is undefined", () => {
    const expectedResult = readXMLFileAsString("forms/viewStatusAddition/minimal.xml")

    const xmlData = exportViewStatusAdditionToXML(mockContext, mockRule, undefined, parentElement)

    const result = xmlExport({ ViewStatusAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/viewStatusAddition/minimal.xml")
    const xmlData = exportViewStatusAdditionToXML(mockContext, mockRule, minimalViewStatusAddition, parentElement)

    const result = xmlExport({ ViewStatusAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
