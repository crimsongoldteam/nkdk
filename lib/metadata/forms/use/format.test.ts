import { expect, it } from "vitest"
import { TUse } from "./types"
import { formatUse } from "./format"

it("should format allow `use`", () => {
  const use: TUse = {
    common: true,
    values: [
      { name: "Администратор", value: true },
      { name: "Пользователь", value: false },
    ],
  }

  const expectedResult = {
    РазрешитьИспользование: {
      Администратор: true,
      Пользователь: false,
    },
  }

  const result = formatUse(use)

  expect(result).toEqual(expectedResult)
})

it("should format disable `use`", () => {
  const use: TUse = {
    common: false,
    values: [
      { name: "Администратор", value: true },
      { name: "Пользователь", value: false },
    ],
  }

  const expectedResult = {
    ЗапретитьИспользование: {
      Администратор: true,
      Пользователь: false,
    },
  }

  const result = formatUse(use)

  expect(result).toEqual(expectedResult)
})
