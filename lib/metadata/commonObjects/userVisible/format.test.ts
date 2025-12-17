import { expect, it } from "vitest"
import { exportUserVisibleToEnterprise } from "./exportToEnterprise"
import { UserVisible } from "./types"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"

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

  const result = exportUserVisibleToEnterprise(use, mockConfigurationSettings)

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

  const result = exportUserVisibleToEnterprise(use, mockConfigurationSettings)

  expect(result).toEqual(expectedResult)
})
