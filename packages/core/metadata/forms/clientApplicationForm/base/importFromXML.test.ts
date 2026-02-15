import { describe, expect, it } from "vitest"
import {
  fullClientApplicationForm,
  minimalClientApplicationForm,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importClientApplicationFormFromXML } from "./importFromXML"
import { ClientApplicationFormXML, FormMetadataXML } from "./types"

describe("importClientApplicationFormFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlForm = readAndParseXMLFile<{ Form: ClientApplicationFormXML }>("forms/clientApplicationForm/full.xml")
    const xmlMetadata = readAndParseXMLFile<{ MetaDataObject: FormMetadataXML }>(
      "forms/clientApplicationForm/fullMetadata.xml"
    )
    const result = importClientApplicationFormFromXML(mockContext, xmlForm.Form, xmlMetadata.MetaDataObject)

    expect(result).toEqual(fullClientApplicationForm)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Form: ClientApplicationFormXML }>("forms/clientApplicationForm/minimal.xml")
    const xmlMetadata = readAndParseXMLFile<{ MetaDataObject: FormMetadataXML }>(
      "forms/clientApplicationForm/minimalMetadata.xml"
    )
    const result = importClientApplicationFormFromXML(mockContext, xmlData.Form, xmlMetadata.MetaDataObject)

    expect(result).toEqual(minimalClientApplicationForm)
  })
})
