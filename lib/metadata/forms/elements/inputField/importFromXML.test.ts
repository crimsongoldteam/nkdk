import { expect, it } from "vitest"
import importInputFieldFromXML from "./importFromXML"
import { TInputField, TInputFieldXML } from "./types"

it("should import name from XML", () => {
  const mockXml: TInputFieldXML = {
    InputField: {
      _name: "ИмяПоля",
      _id: "16",
      Title: [{ "v8:item": { "v8:lang": "ru", "v8:content": "Поле" } }],
    },
  }

  const mockResult: TInputField = {
    name: "ИмяПоля",
    title: { ru: "Поле" },
    id: "16",
  }

  const input = importInputFieldFromXML(mockXml)

  expect(input).toEqual(mockResult)
})
