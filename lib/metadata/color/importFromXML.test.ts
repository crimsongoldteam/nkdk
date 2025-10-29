import { expect, it } from "vitest"
import importColorFromXML from "./importFromXML"
import { TColor, ZColorXML } from "./types"
import { xmlImport } from "~/lib"

it("should import color from XML", () => {
  const mockXml = `<Color>style:NegativeTextColor</Color>`

  const mockResult: TColor = "style:NegativeTextColor"

  const xml = xmlImport<any>(mockXml)
  const value = xml[Object.keys(xml)[0]]

  const valueParsed = ZColorXML.parse(value)

  const result = importColorFromXML(valueParsed)

  expect(result).toEqual(mockResult)
})
