import { expect, it } from "vitest"
import exportI8nXmlTextToXML from "./exportI8nTextToXML"
import { TI8nText, TI8nTextXML } from "./types"

it("should export I8nText to XML", () => {
  const mockI8nText: TI8nText = {
    ru: "Поле",
  }
  const mockXml: TI8nTextXML = [{ "v8:item": { "v8:lang": "ru", "v8:content": "Поле" } }]

  const i8nXMLText = exportI8nXmlTextToXML(mockI8nText)
  expect(i8nXMLText).toEqual(mockXml)
})

it("should export I8nText to XML with multiple languages", () => {
  const mockI8nText: TI8nText = {
    ru: "Поле",
    en: "Field",
  }
  const mockXml: TI8nTextXML = [
    { "v8:item": { "v8:lang": "ru", "v8:content": "Поле" } },
    { "v8:item": { "v8:lang": "en", "v8:content": "Field" } },
  ]

  const result = exportI8nXmlTextToXML(mockI8nText)

  expect(result).toEqual(mockXml)
})

it("should return undefined for undefined input", () => {
  const result = exportI8nXmlTextToXML(undefined)

  expect(result).toBeUndefined()
})
