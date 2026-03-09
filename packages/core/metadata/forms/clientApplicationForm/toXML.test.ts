import { describe, expect, it } from "vitest"
import {
  clientApplicationFormReference,
  fullClientApplicationForm,
  minimalClientApplicationForm,
  minimalClientApplicationFormMetadataReference,
  minimalClientApplicationFormReference,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockContextToXML } from "~/tests/mockContext"
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
        referenceForm: clientApplicationFormReference,
      })

      const result = xmlExport({ Form: xmlData })

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/clientApplicationForm/minimal.xml")
      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: minimalClientApplicationForm,
        referenceForm: minimalClientApplicationFormReference,
      })

      const result = xmlExport({ Form: xmlData })

      expect(result).toEqual(expectedResult)
    })
  })

  describe("exportFormMetadataToXML", () => {
    it("should export all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/clientApplicationForm/fullMetadata.xml")
      const xmlData = exportFormMetadataToXML({
        context: mockContextToXML(),
        form: fullClientApplicationForm,
        referenceForm: clientApplicationFormReference,
        name: "ФормаКакаяТо",
      })

      const result = xmlExport({ MetaDataObject: xmlData })

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/clientApplicationForm/minimalMetadata.xml")
      const xmlData = exportFormMetadataToXML({
        context: mockContextToXML(),
        form: minimalClientApplicationForm,
        referenceForm: minimalClientApplicationFormMetadataReference,
        name: "ФормаКакаяТо",
      })

      const result = xmlExport({ MetaDataObject: xmlData })

      expect(result).toEqual(expectedResult)
    })
  })
})
