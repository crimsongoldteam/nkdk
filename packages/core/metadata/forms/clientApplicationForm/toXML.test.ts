import { describe, expect, it } from "vitest"
import {
  fullClientApplicationForm,
  minimalClientApplicationForm,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockContextToXML, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "./toXML"

describe("exportToXML", () => {
  describe("exportClientApplicationFormToXML", () => {
    it("should export all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/clientApplicationForm/full.xml")
      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: fullClientApplicationForm,
        referenceForm: fullClientApplicationForm,
      })

      const result = xmlExport({ Form: xmlData })

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/clientApplicationForm/minimal.xml")
      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: minimalClientApplicationForm,
        referenceForm: minimalClientApplicationForm,
      })

      const result = xmlExport({ Form: xmlData })

      expect(result).toEqual(expectedResult)
    })
  })

  describe("exportFormMetadataToXML", () => {
    it("should export all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/clientApplicationForm/fullMetadata.xml")
      const xmlData = exportFormMetadataToXML(mockContextToXML(), mockRule, fullClientApplicationForm, "ФормаКакаяТо")

      const result = xmlExport({ MetaDataObject: xmlData })

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/clientApplicationForm/minimalMetadata.xml")
      const xmlData = exportFormMetadataToXML(
        mockContextToXML(),
        mockRule,
        minimalClientApplicationForm,
        "ФормаКакаяТо"
      )

      const result = xmlExport({ MetaDataObject: xmlData })

      expect(result).toEqual(expectedResult)
    })
  })
})
