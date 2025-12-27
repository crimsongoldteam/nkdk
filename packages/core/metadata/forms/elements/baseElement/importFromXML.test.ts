import { expect, it } from "vitest"
import { xmlImport } from "~/packages/core"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { importBaseElementFromXML } from "./importFromXML"
import { BaseElement, BaseElementXML } from "./types"

it("should decode element from XML", () => {
  const mockXml = `<BaseElement name="ИмяПоля" id="16">`

  const mockResult: BaseElement = {
    name: "ИмяПоля",
    elementType: FormElementType.BaseElement,
    id: "16",
  }

  const xml = xmlImport<{ BaseElement: BaseElementXML }>(mockXml)

  const result = importBaseElementFromXML(mockСontext, xml.BaseElement)

  expect(result).toEqual(mockResult)
})
