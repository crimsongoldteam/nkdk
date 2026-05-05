import { describe, expect, it } from "vitest"
import {
  fullClientApplicationForm,
  minimalClientApplicationForm,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importClientApplicationFormFromXML } from "./fromXML"
import { ClientApplicationFormXML, FormMetadataXML } from "./types"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importClientApplicationFormFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlForm = readAndParseXMLFile<{ Form: ClientApplicationFormXML }>("forms/clientApplicationForm/full.xml")
    const xmlMetadata = readAndParseXMLFile<{ MetaDataObject: FormMetadataXML }>(
      "forms/clientApplicationForm/fullMetadata.xml"
    )
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlForm.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result).toEqual(fullClientApplicationForm)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Form: ClientApplicationFormXML }>("forms/clientApplicationForm/minimal.xml")
    const xmlMetadata = readAndParseXMLFile<{ MetaDataObject: FormMetadataXML }>(
      "forms/clientApplicationForm/minimalMetadata.xml"
    )
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlData.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result).toEqual(minimalClientApplicationForm)
  })
})
