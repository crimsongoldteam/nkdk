import { expect, it } from "vitest"
import importI8nTextFromXML from "./importI8nTextFromXML"
import { ZI8nTextXML } from "../types"

it("should import I8nText from XML", () => {
  const mockXml = {
    item: [{ lang: "ru", content: "Поле" }],
  }

  const i8nXMLText = ZI8nTextXML.parse(mockXml)

  const result = importI8nTextFromXML(i8nXMLText)

  expect(result).toEqual({ ru: "Поле" })
})

it("should import I8nText from XML with multiple languages", () => {
  const mockXml = {
    item: [
      { lang: "ru", content: "Поле" },
      { lang: "en", content: "Field" },
    ],
  }
  const i8nXMLText = ZI8nTextXML.parse(mockXml)

  const result = importI8nTextFromXML(i8nXMLText)

  expect(result).toEqual({
    ru: "Поле",
    en: "Field",
  })
})

it("should return undefined for undefined input", () => {
  const result = importI8nTextFromXML(undefined)

  expect(result).toBeUndefined()
})
