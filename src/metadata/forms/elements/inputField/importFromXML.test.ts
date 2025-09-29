import { expect, it } from "vitest"
import importInputFieldFromXML from "./importFromXML"
import { ZInputFieldXML } from "./types"

it("should import name from XML", () => {
  const mockXml = ZInputFieldXML.parse({
    _name: "ИмяПоля",
    Title: {
      item: [{ lang: "ru", content: "Поле" }],
    },
  })

  const input = importInputFieldFromXML(mockXml)

  expect(input.name).toEqual("ИмяПоля")
})

it("should import title from XML", () => {
  const mockXml = ZInputFieldXML.parse({
    _name: "ИмяПоля",
    Title: {
      item: [{ lang: "ru", content: "Поле" }],
    },
  })

  const input = importInputFieldFromXML(mockXml)

  expect(input.title).toEqual({ ru: "Поле" })
})
