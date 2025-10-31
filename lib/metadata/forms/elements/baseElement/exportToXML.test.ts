import { expect, it, describe } from "vitest"
import { exportBaseElementToXML } from "./exportToXML"
import { importBaseElementFromXML } from "./importFromXML"
import { TBaseElement, TBaseElementXML, ZBaseElementXML } from "./types"
import { ZElementType } from "../types"
import { xmlExport, xmlImport } from "~/lib"
import z from "zod"

describe("exportBaseElementToXML", () => {
  it("should export base element to XML", () => {
    const mockElement: TBaseElement = {
      name: "ИмяПоля",
      elementType: ZElementType.enum.BaseElement,
      id: "16",
    }

    const expectedResult = `<BaseElement name="ИмяПоля" id="16"/>`

    const result = { BaseElement: exportBaseElementToXML(mockElement) }
    const xmlString = xmlExport(result, z.object({ BaseElement: ZBaseElementXML }), false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportBaseElementToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import base element correctly (round-trip)", () => {
    const originalXml = `<BaseElement name="ИмяПоля" id="16"/>`

    const xml = xmlImport<{ BaseElement: TBaseElementXML }>(originalXml, z.object({ BaseElement: ZBaseElementXML }))
    const imported = importBaseElementFromXML(xml.BaseElement)
    const exported = exportBaseElementToXML(imported)
    const resultXml = xmlExport({ BaseElement: exported }, z.object({ BaseElement: ZBaseElementXML }), false)

    expect(resultXml).toEqual(originalXml)
  })
})

