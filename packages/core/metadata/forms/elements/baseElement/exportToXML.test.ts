import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { exportBaseElementToXML } from "./exportToXML"
import { importBaseElementFromXML } from "./importFromXML"
import { BaseElement, BaseElementXML } from "./types"
import { xmlExport, xmlImport } from "~/index.ts"

describe("exportBaseElementToXML", () => {
  it("should export base element to XML", () => {
    const mockElement: BaseElement = {
      name: "ИмяПоля",
      elementType: FormElementType.BaseElement,
      id: "16",
    }

    const expectedResult = `<BaseElement id="16" name="ИмяПоля"/>`

    const result = { BaseElement: exportBaseElementToXML(mockСontext, mockElement) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportBaseElementToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import base element correctly (round-trip)", () => {
    const originalXml = `<BaseElement id="16" name="ИмяПоля"/>`

    const xml = xmlImport<{ BaseElement: BaseElementXML }>(originalXml)
    const imported = importBaseElementFromXML(mockСontext, xml.BaseElement)
    const exported = exportBaseElementToXML(mockСontext, imported)
    const resultXml = xmlExport({ BaseElement: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
