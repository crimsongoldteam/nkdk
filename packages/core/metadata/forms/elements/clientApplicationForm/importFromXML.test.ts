import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromXML"
import {
  attributesForm,
  commandBarForm,
  itemsForm,
  titleForm,
  usualGroupForm,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importClientApplicationFormFromXML } from "./importFromXML"
import { ClientApplicationFormXML } from "./types"

describe("importClientApplicationFormFromXML", () => {
  it("should import title from XML", () => {
    const xmlData = readAndParseXMLFile<{ Form: ClientApplicationFormXML }>("forms/clientApplicationForm/title.xml")
    const element = importClientApplicationFormFromXML(mockСontext, xmlData.Form)

    expect(element).toMatchObject(titleForm)
  })

  it("should import command bar from XML", () => {
    const xmlData = readAndParseXMLFile<{ Form: ClientApplicationFormXML }>("forms/clientApplicationForm/commandBar.xml")
    const element = importClientApplicationFormFromXML(mockСontext, xmlData.Form)

    expect(element).toMatchObject(commandBarForm)
  })

  it("should import items from XML", () => {
    const xmlData = readAndParseXMLFile<{ Form: ClientApplicationFormXML }>("forms/clientApplicationForm/items.xml")
    const form = importClientApplicationFormFromXML(mockСontext, xmlData.Form)

    expect(form).toMatchObject(itemsForm)
  })

  it("should import attributes from XML", () => {
    const xmlData = readAndParseXMLFile<{ Form: ClientApplicationFormXML }>("forms/clientApplicationForm/attributes.xml")

    const form = importClientApplicationFormFromXML(mockСontext, xmlData.Form)

    expect(form).toMatchObject(attributesForm)
  })

  it("should import usual group child items from XML", () => {
    const xmlData = readAndParseXMLFile<{ Form: ClientApplicationFormXML }>("forms/clientApplicationForm/usualGroup.xml")

    const form = importClientApplicationFormFromXML(mockСontext, xmlData.Form)

    expect(form).toMatchObject(usualGroupForm)
  })
})
