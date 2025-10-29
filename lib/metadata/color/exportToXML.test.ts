import { expect, it } from "vitest"
import exportColorToXML from "./exportToXML"
import { TColor } from "./types"
import { xmlExport } from "~/lib"

it("should export color to XML", () => {
  const expectedResult = `<Color>style:NegativeTextColor</Color>`

  const mockColor: TColor = "style:NegativeTextColor"

  const result = { Color: exportColorToXML(mockColor) }
  const xmlString = xmlExport(result, false)

  expect(xmlString).toEqual(expectedResult)
})
