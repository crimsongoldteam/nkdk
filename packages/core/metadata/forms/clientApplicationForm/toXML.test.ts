import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import {
  fullClientApplicationForm,
  minimalClientApplicationForm,
  minimalClientApplicationFormReference,
} from "./__fixtures__/data"
import { importClientApplicationFormFromXML } from "./fromXML"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "./toXML"
import { ClientApplicationFormXML, FormMetadataXML } from "./types"

describe("exportToXML", () => {
  describe("exportClientApplicationFormToXML", () => {
    it("should export all fields to XML", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "full.xml")

      const referenceForm = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "full.xml")

      const referenceMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
        import.meta.url,
        "fullMetadata.xml"
      )

      const clientApplicationFormReference = importClientApplicationFormFromXML({
        context: mockContextFromXML({ forReference: true }),
        xml: referenceForm.Form,
        xmlMetadata: referenceMetadata.MetaDataObject,
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
      const expectedResult = readXMLFixtureAsString(import.meta.url, "minimal.xml")
      const referenceFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "minimal.xml")
      const referenceMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
        import.meta.url,
        "minimalMetadata.xml"
      )
      const referenceForm = importClientApplicationFormFromXML({
        context: mockContextFromXML({ forReference: true }),
        xml: referenceFormXML.Form,
        xmlMetadata: referenceMetadataXML.MetaDataObject,
      })
      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: minimalClientApplicationForm,
        referenceForm,
      })

      const result = xmlExport({ Form: xmlData })

      expect(result).toEqual(expectedResult)
    })
  })

  describe("exportFormMetadataToXML", () => {
    it("should export all fields to XML", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "fullMetadata.xml")
      const xmlData = exportFormMetadataToXML({
        context: mockContextToXML(),
        form: fullClientApplicationForm,
        referenceForm: undefined,
        name: "ФормаКакаяТо",
      })

      const result = xmlExport({ MetaDataObject: xmlData })

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "minimalMetadata.xml")
      const minimalFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "minimal.xml")
      const minimalMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
        import.meta.url,
        "minimalMetadata.xml"
      )
      const referenceForm = importClientApplicationFormFromXML({
        context: mockContextFromXML({ forReference: true }),
        xml: minimalFormXML.Form,
        xmlMetadata: minimalMetadataXML.MetaDataObject,
      })
      const xmlData = exportFormMetadataToXML({
        context: mockContextToXML(),
        form: minimalClientApplicationForm,
        referenceForm,
        name: "Минимальная",
      })

      const result = xmlExport({ MetaDataObject: xmlData })

      expect(result).toEqual(expectedResult)
    })
  })
})
