import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { FormElementType } from "../../../metadataFactory/types"
import { exportBaseElementToXML } from "./exportToXML"
import { BaseElement } from "./types"

describe("exportBaseElementToXML", () => {
  it("should export base element to XML", () => {
    const mockElement: BaseElement = {
      name: "ИмяПоля",
      elementType: FormElementType.BaseElement,
    }

    const expectedResult = `<BaseElement name="ИмяПоля" id="16"/>`

    const result = { BaseElement: exportBaseElementToXML(mockСontext, mockElement) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportBaseElementToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
