import { expect, it } from "vitest"
import { importInputFieldFromXML } from "./importFromXML"
import { TInputField, TInputFieldXML } from "./types"
import { ZElementType } from "../types"

it("should import name from XML", () => {
  const mockXml: TInputFieldXML = {
    _name: "ИмяПоля",
    _id: "16",
    Title: { "v8:item": { "v8:lang": "ru", "v8:content": "Поле" } },
  }

  const mockResult: TInputField = {
    name: "ИмяПоля",
    elementType: ZElementType.enum.InputField,
    title: { items: { ru: "Поле" } },
    id: "16",
  }

  const input = importInputFieldFromXML(mockXml)

  expect(input).toEqual(mockResult)
})
