import { expect, it } from "vitest"
import importUseFromXML from "./importFromXML"
import { TUse, TUseXML } from "./types"

it("should import Use from XML", () => {
  const mockXml: TUseXML = {
    Common: true,
    Value: [
      {
        _name: "Role.Администратор",
        value: true,
      },
      {
        _name: "Role.Пользователь",
        value: false,
      },
    ],
  }

  const mockResult: TUse = {
    common: true,
    values: [
      {
        name: "Администратор",
        value: true,
      },
      {
        name: "Пользователь",
        value: false,
      },
    ],
  }

  const result = importUseFromXML(mockXml)

  expect(result).toEqual(mockResult)
})

it("should import Use from XML with empty values", () => {
  const mockXml: TUseXML = {
    Common: false,
    Value: [],
  }

  const mockResult: TUse = {
    common: false,
    values: [],
  }

  const result = importUseFromXML(mockXml)

  expect(result).toEqual(mockResult)
})

it("should return undefined for undefined input", () => {
  const result = importUseFromXML(undefined)

  expect(result).toBeUndefined()
})

it("should handle single value in Use XML", () => {
  const mockXml: TUseXML = {
    Common: true,
    Value: [
      {
        _name: "Role.Менеджер",
        value: true,
      },
    ],
  }

  const mockResult: TUse = {
    common: true,
    values: [
      {
        name: "Менеджер",
        value: true,
      },
    ],
  }

  const result = importUseFromXML(mockXml)

  expect(result).toEqual(mockResult)
})
