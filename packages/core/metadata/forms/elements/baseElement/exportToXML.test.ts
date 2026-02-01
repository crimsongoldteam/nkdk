import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { FormElementType } from "../../../metadataFactory/types"
import { exportElementPropsToXML } from "./exportToXML"
import { NamedElement } from "./types"

describe("exportBaseElementToXML", () => {
  it("should export base element to XML", () => {
    const mockElement: NamedElement = {
      name: "ИмяПоля",
      elementType: FormElementType.BaseElement,
    }

    const expectedResult = `<BaseElement name="ИмяПоля" id="1"/>`

    const result = { BaseElement: exportElementPropsToXML(mockContext, mockElement) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })
})
