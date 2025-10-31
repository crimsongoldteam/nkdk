import { expect, it } from "vitest"
import { importI8nTextFromXML } from "./importI8nTextFromXML"
import { TI8nTextXML } from "./types"
import { TI8nText } from "~/lib/metadata/i8nText/types"

it("should import I8nText from XML", () => {
  const mockXml: TI8nTextXML = [{ "v8:item": { "v8:lang": "ru", "v8:content": "Поле" } }]

  const mockResult: TI8nText = { ru: "Поле" }

  const result = importI8nTextFromXML(mockXml)

  expect(result).toEqual(mockResult)
})

it("should import I8nText from XML with multiple languages", () => {
  const mockXml: TI8nTextXML = [
    { "v8:item": { "v8:lang": "ru", "v8:content": "Поле" } },
    { "v8:item": { "v8:lang": "en", "v8:content": "Field" } },
  ]

  const mockResult: TI8nText = {
    ru: "Поле",
    en: "Field",
  }

  const result = importI8nTextFromXML(mockXml)

  expect(result).toEqual(mockResult)
})

it("should return undefined for undefined input", () => {
  const result = importI8nTextFromXML(undefined)

  expect(result).toBeUndefined()
})
