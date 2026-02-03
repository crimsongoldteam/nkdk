import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/button/exportToXML"
import "~/metadata/forms/elements/inputField/exportToXML"
import "~/metadata/forms/elements/usualGroup/exportToXML"
import {
  fullClientApplicationForm,
  minimalClientApplicationForm,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "./exportToXML"

describe("exportToXML", () => {
  describe("exportClientApplicationFormToXML", () => {
    it("should return undefined when data is undefined", () => {
      const result = exportClientApplicationFormToXML(mockContext, undefined)

      expect(result).toBeUndefined()
    })

    it("should export all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/clientApplicationForm/full.xml")
      const xmlData = exportClientApplicationFormToXML(mockContext, fullClientApplicationForm)

      const result = xmlExport({ Form: xmlData })

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/clientApplicationForm/minimal.xml")
      const xmlData = exportClientApplicationFormToXML(mockContext, minimalClientApplicationForm)

      const result = xmlExport({ Form: xmlData })

      expect(result).toEqual(expectedResult)
    })
  })
  describe("exportFormMetadataToXML", () => {
    it("should export all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/clientApplicationForm/fullMetadata.xml")
      const xmlData = exportFormMetadataToXML(mockContext, mockRule, fullClientApplicationForm, "ФормаКакаяТо")

      const result = xmlExport({ MetaDataObject: xmlData })

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFileAsString("forms/clientApplicationForm/minimalMetadata.xml")
      const xmlData = exportFormMetadataToXML(mockContext, mockRule, minimalClientApplicationForm, "ФормаКакаяТо")

      const result = xmlExport({ MetaDataObject: xmlData })

      expect(result).toEqual(expectedResult)
    })
  })
})
