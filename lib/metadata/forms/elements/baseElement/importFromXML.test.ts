import { expect, it } from "vitest"
import { xmlImport } from "~/lib"
import { FormElementType } from "../../../metadataFactory/types"
import { importBaseElementFromXML } from "./importFromXML"
import { BaseElement, BaseElementXML } from "./types"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"

it("should decode element from XML", () => {
  const mockXml = `<BaseElement name="ИмяПоля" id="16">`

  const mockResult: BaseElement = {
    name: "ИмяПоля",
    elementType: FormElementType.BaseElement,
    id: "16",
  }

  const xml = xmlImport<BaseElementXML>(mockXml)

  const result = importBaseElementFromXML(xml, mockConfigurationSettings)

  expect(result).toEqual(mockResult)
})
