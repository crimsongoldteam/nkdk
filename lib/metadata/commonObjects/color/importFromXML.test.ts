import { expect, it } from "vitest"
import { xmlImport } from "~/lib/xml/import/importer"
import { importColorFromXML } from "./importFromXML"
import { Color, ColorXML } from "./types"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"

it("should import color from XML", () => {
  const mockXml = `<Color>style:NegativeTextColor</Color>`

  const mockResult: Color = "style:NegativeTextColor"

  const xml = xmlImport<{ Color: ColorXML }>(mockXml)
  const value = xml.Color

  const result = importColorFromXML(mockConfigurationSettings, value)

  expect(result).toEqual(mockResult)
})
