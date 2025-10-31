import { expect, it } from "vitest"
import { importColorFromXML } from "./importFromXML"
import { TColor, TColorXML, ZColorXML } from "./types"
import { xmlImport } from "~/lib"
import z from "zod"

it("should import color from XML", () => {
  const mockXml = `<Color>style:NegativeTextColor</Color>`

  const mockResult: TColor = "style:NegativeTextColor"

  const xml = xmlImport<{ Color: TColorXML }>(mockXml, z.object({ Color: ZColorXML }))
  const value = xml.Color

  const result = importColorFromXML(value)

  expect(result).toEqual(mockResult)
})
