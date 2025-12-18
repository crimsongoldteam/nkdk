import { expect, it } from "vitest"
import { xmlImport } from "~/lib"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
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

  const result = importBaseElementFromXML(xml.BaseElement, mockConfigurationSettings)

  expect(result).toEqual(mockResult)
})
