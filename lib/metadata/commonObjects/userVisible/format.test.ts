import { expect, it } from "vitest"
import { TUserVisible } from "./types"
import { formatUserVisible } from "./format"

it("should format allow `use`", () => {
  const use: TUserVisible = {
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
  const use: TUserVisible = {
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
