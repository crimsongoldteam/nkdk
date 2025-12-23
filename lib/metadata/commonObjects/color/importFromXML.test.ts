import { expect, it } from "vitest"
import { mockcontext } from "~/lib/tests/mockContext"
import { xmlImport } from "~/lib/xml/import/importer"
import { importColorFromXML } from "./importFromXML"
import { Color, ColorXML } from "./types"

it("should import color from XML", () => {
  const mockXml = `<Color>style:NegativeTextColor</Color>`

  const mockResult: Color = "style:NegativeTextColor"

  const xml = xmlImport<{ Color: ColorXML }>(mockXml)
  const value = xml.Color

  const result = importColorFromXML(mockcontext, value)

  expect(result).toEqual(mockResult)
})
