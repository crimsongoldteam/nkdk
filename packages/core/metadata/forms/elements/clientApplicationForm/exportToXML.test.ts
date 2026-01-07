import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/inputField/exportToXML"
import "~/metadata/forms/elements/usualGroup/exportToXML"
import {
  attributesForm,
  commandBarForm,
  itemsForm,
  titleForm,
  usualGroupForm,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportClientApplicationFormToXML } from "./exportToXML"

describe("exportClientApplicationFormToXML", () => {
  it("should export title to XML", () => {
    const expectedResult = readXMLFileAsString("forms/clientApplicationForm/exportTitle.xml")

    const exported = exportClientApplicationFormToXML(mockСontext, titleForm)
    const xmlString = xmlExport({ Form: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export command bar to XML", () => {
    const expectedResult = readXMLFileAsString("forms/clientApplicationForm/exportCommandBar.xml")

    const exported = exportClientApplicationFormToXML(mockСontext, commandBarForm)
    const xmlString = xmlExport({ Form: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export items to XML", () => {
    const expectedResult = readXMLFileAsString("forms/clientApplicationForm/exportItems.xml")

    const exported = exportClientApplicationFormToXML(mockСontext, itemsForm)
    const xmlString = xmlExport({ Form: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export attributes to XML", () => {
    const expectedResult = readXMLFileAsString("forms/clientApplicationForm/exportAttributes.xml")

    const exported = exportClientApplicationFormToXML(mockСontext, attributesForm)
    const xmlString = xmlExport({ Form: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export usual group child items to XML", () => {
    const expectedResult = readXMLFileAsString("forms/clientApplicationForm/exportUsualGroup.xml")

    const exported = exportClientApplicationFormToXML(mockСontext, usualGroupForm)
    const xmlString = xmlExport({ Form: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })
})
