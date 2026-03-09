import { describe, expect, it } from "vitest"
import {
  clientApplicationFormReference,
  fullClientApplicationForm,
  minimalClientApplicationForm,
  minimalClientApplicationFormMetadataReference,
  minimalClientApplicationFormReference,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readAndParseXMLFile, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { importClientApplicationFormFromXML } from "./fromXML"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "./toXML"
import { ClientApplicationFormXML, FormMetadataXML } from "./types"

describe("exportToXML", () => {
  describe("exportClientApplicationFormToXML", () => {
    it("should export all fields to XML", () => {
      const expectedResult = readXMLFileAsString("forms/clientApplicationForm/full.xml")

      const referenceForm = readAndParseXMLFile<{ Form: ClientApplicationFormXML }>(
        "forms/clientApplicationForm/full.xml"
      )

      const referenceMetadata = readAndParseXMLFile<{ MetaDataObject: FormMetadataXML }>(
        "forms/clientApplicationForm/fullMetadata.xml"
      )

      const clientApplicationFormReference = importClientApplicationFormFromXML({
        context: mockContextToXML(),
        xml: referenceForm.Form,
        xmlMetadata: referenceMetadata.MetaDataObject,
        forReference: true,
      })

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
