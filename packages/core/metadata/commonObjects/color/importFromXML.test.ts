import { expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { xmlImport } from "~/xml/import/importer"
import { importColorFromXML } from "./importFromXML"
import { Color, ColorXML } from "./types"

it("should import color from XML", () => {
  const mockXml = `<Color>style:NegativeTextColor</Color>`

  const mockResult: Color = "style:NegativeTextColor"

  const xml = xmlImport<{ Color: ColorXML }>(mockXml)
  const value = xml.Color

  const result = importColorFromXML(mockСontext, value)

  expect(result).toEqual(mockResult)
})
