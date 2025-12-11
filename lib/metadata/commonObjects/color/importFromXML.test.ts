import { expect, it } from "vitest"
import { importColorFromXML } from "./importFromXML"
import { Color, ColorXML } from "./types"
import { xmlImport } from "~/lib/xml/import/importer"

it("should import color from XML", () => {
  const mockXml = `<Color>style:NegativeTextColor</Color>`

  const mockResult: Color = "style:NegativeTextColor"

  const xml = xmlImport<{ Color: ColorXML }>(mockXml)
  const value = xml.Color

  const result = importColorFromXML(value)

  expect(result).toEqual(mockResult)
})
