import { expect, it } from "vitest"
import { UserVisible } from "./types"
import { formatUserVisible } from "./format"

it("should format allow `use`", () => {
  const use: UserVisible = {
    common: true,
    values: [
      { name: "Администратор", value: true },
      { name: "Пользователь", value: false },
    ],
  }

  const expectedResult = {
    Администратор: "Истина",
    Пользователь: "Ложь",
  }

  const result = formatUserVisible(use)

  expect(result).toEqual(expectedResult)
})

it("should format disable `use`", () => {
  const use: UserVisible = {
    common: false,
    values: [
      { name: "Администратор", value: true },
      { name: "Пользователь", value: false },
    ],
  }

  const expectedResult = {
    Администратор: "Истина",
    Пользователь: "Ложь",
  }

  const result = formatUserVisible(use)

  expect(result).toEqual(expectedResult)
})
