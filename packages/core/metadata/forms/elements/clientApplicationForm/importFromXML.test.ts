import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromXML"
import { fullClientApplicationForm, minimalClientApplicationForm } from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importClientApplicationFormFromXML } from "./importFromXML"
import { ClientApplicationFormXML } from "./types"

describe("importClientApplicationFormFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Form: ClientApplicationFormXML }>("forms/clientApplicationForm/full.xml")

    const result = importClientApplicationFormFromXML(mockСontext, xmlData.Form)

    expect(result).toMatchObject(fullClientApplicationForm)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Form: ClientApplicationFormXML }>("forms/clientApplicationForm/minimal.xml")

    const result = importClientApplicationFormFromXML(mockСontext, xmlData.Form)

    expect(result).toMatchObject(minimalClientApplicationForm)
  })
})
