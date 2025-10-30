import { expect, it } from "vitest"
import { TBaseElement, TBaseElementXML } from "./types"
import { ZElementType } from "~/lib/metadata/systemEnumerations/types"
import { importBaseElementFromXML } from "./importBaseElementFromXML"
import { xmlImport } from "~/lib"

it("should decode element from XML", () => {
  const mockXml = `<InputField name="ИмяПоля" id="16">`

  const mockResult: TBaseElement = {
    name: "ИмяПоля",
    elementType: ZElementType.enum.InputField,
    id: "16",
  }

  const xml = xmlImport<TBaseElementXML>(mockXml)

  const input = importBaseElementFromXML(xml)

  expect(input).toEqual(mockResult)
})
