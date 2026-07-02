import { describe, expect, it } from "vitest"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import {
  catalogFullClientApplicationForm,
  childItemsWidthClientApplicationForm,
  conditionalAppearanceWithoutAttributesClientApplicationForm,
  customSettingsFolderClientApplicationForm,
  fullClientApplicationForm,
  minimalClientApplicationForm,
} from "./__fixtures__/data"
import { documentFullClientApplicationForm } from "./__fixtures__/documentFull"
import { reportFormClientApplicationForm } from "./__fixtures__/reportForm"
import { importClientApplicationFormFromXML } from "./fromXML"
import { ClientApplicationFormXML, FormMetadataXML } from "./types"
import { mockContextFromXML } from "../../../tests/mockContext"

describe("importClientApplicationFormFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlForm = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "full.xml")
    const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(import.meta.url, "fullMetadata.xml")
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlForm.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result).toEqual(fullClientApplicationForm)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "minimal.xml")
    const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "minimalMetadata.xml"
    )
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlData.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result).toEqual(minimalClientApplicationForm)
  })

  it("imports explicit empty ExtendedPresentation from metadata XML", () => {
    const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "minimal.xml")
    const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "minimalMetadata.xml"
    )
    xmlMetadata.MetaDataObject.Form.Properties.ExtendedPresentation = ""

    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlData.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result.extendedPresentation).toEqual({ items: {} })
  })

  it("imports catalog full form from XML", () => {
    const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "catalogFull.xml")
    const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "minimalMetadata.xml"
    )
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlData.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result).toEqual(catalogFullClientApplicationForm)
  })

  it("imports document full form from XML", () => {
    const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "documentFull.xml")
    const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "minimalMetadata.xml"
    )
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlData.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result).toEqual(documentFullClientApplicationForm)
  })

  it("imports conditional appearance without attributes", () => {
    const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(
      import.meta.url,
      "conditionalAppearanceWithoutAttributes.xml"
    )
    const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "minimalMetadata.xml"
    )
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlData.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result).toEqual(conditionalAppearanceWithoutAttributesClientApplicationForm)
  })

  it("imports CustomSettingsFolder", () => {
    const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(
      import.meta.url,
      "customSettingsFolder.xml"
    )
    const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "customSettingsFolderMetadata.xml"
    )
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlData.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result).toEqual(customSettingsFolderClientApplicationForm)
  })

  it("imports root ChildItemsWidth", () => {
    const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "childItemsWidth.xml")
    const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "minimalMetadata.xml"
    )
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlData.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result).toEqual(childItemsWidthClientApplicationForm)
  })

  it("imports decimal report result fields as numbers", () => {
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: {
        ReportResult: { "_xsi:type": "xs:decimal", "#text": "3" },
        DetailsData: { "_xsi:type": "xs:decimal", "#text": "0" },
      },
      xmlMetadata: { Form: { Properties: {} } },
    })

    expect(result.reportResult).toBe(3)
    expect(result.detailsData).toBe(0)
  })

  it("imports report form extension fields", () => {
    const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "reportForm.xml")
    const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "reportFormMetadata.xml"
    )
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlData.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result).toEqual(reportFormClientApplicationForm)
  })
})
