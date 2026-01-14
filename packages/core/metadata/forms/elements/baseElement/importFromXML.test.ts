import { expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import xmlImport from "~/xml/import/importer"
import { FormElementType } from "../../../metadataFactory/types"
import { importBaseElementFromXML } from "./importFromXML"
import { BaseElementXML, NamedElement } from "./types"

it("should decode element from XML", () => {
  const mockXml = `<BaseElement name="ИмяПоля" id="16">`

  const mockResult: NamedElement = {
    name: "ИмяПоля",
    elementType: FormElementType.BaseElement,
  }

  const xml = xmlImport<{ BaseElement: BaseElementXML }>(mockXml)

  const result = importBaseElementFromXML(mockСontext, xml.BaseElement)

  expect(result).toEqual(mockResult)
})
