import { expect, it } from "vitest"
import { TBaseElement, TBaseElementXML } from "./types"
import { ZElementType } from "../types"
import { importBaseElementFromXML } from "./importFromXML"
import { xmlImport } from "~/lib"

it("should decode element from XML", () => {
  const mockXml = `<InputField name="ИмяПоля" id="16">`

  const mockResult: TBaseElement = {
    name: "ИмяПоля",
    elementType: ZElementType.enum.InputField,
    id: "16",
  }

  const xml = xmlImport<{ [key: string]: TBaseElementXML }>(mockXml)
  const value = xml[Object.keys(xml)[0]]!

  const input = importBaseElementFromXML(value)

  expect(input).toEqual(mockResult)
})
