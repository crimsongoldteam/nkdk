import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { FormElementType } from "../../../metadataFactory/types"
import { exportElementToXML } from "../../../metadataFactory"
import { NamedElement } from "./types"

describe("exportBaseElementToXML", () => {
  it("should export base element to XML", () => {
    const mockElement: NamedElement = {
      name: "ИмяПоля",
      elementType: FormElementType.BaseElement,
    }

    const expectedResult = `<BaseElement name="ИмяПоля" id="1"/>`

    const xmlData = exportElementToXML({ context: mockContext, data: mockElement })
    const result = { BaseElement: xmlData }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })
})
