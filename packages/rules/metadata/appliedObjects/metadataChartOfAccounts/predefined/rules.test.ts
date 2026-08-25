import { describe, expect, it } from "vitest"

import { classifyExtDimensionTypeYamlKey } from "./rules"

describe("ключ вида субконто предопределённого счёта", () => {
  it("принимает ссылку на предопределённое значение плана видов характеристик", () => {
    expect(classifyExtDimensionTypeYamlKey(
      "ChartOfCharacteristicTypes.ВидыСубконто.СубкнтоОдно",
    )).toBe("valid")
  })

  it.each([
    "1Имя",
    "Catalog.Товары.Предопределённый",
    "ChartOfCharacteristicTypes.ВидыСубконто",
  ])("отклоняет недопустимый ключ %s", (value) => {
    expect(classifyExtDimensionTypeYamlKey(value)).toBe("invalid")
  })
})
