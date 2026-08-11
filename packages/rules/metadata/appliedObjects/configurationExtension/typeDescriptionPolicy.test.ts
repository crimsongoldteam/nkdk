import { describe, expect, it } from "vitest"
import { configurationExtensionTypeDescriptionXMLNameByType } from "./typeDescriptionPolicy"

describe("configurationExtensionTypeDescriptionXMLNameByType", () => {
  it.each([
    ["Версия8_1", "AnyRef"],
    ["Версия8_3_9", "AnyRef"],
    ["Версия8_3_20", "AnyRef"],
    ["Версия8_3_22", "AnyRef"],
    ["Версия8_3_23", "AnyIBRef"],
    ["Версия8_3_27", "AnyIBRef"],
    ["НеИспользовать", "AnyIBRef"],
    [undefined, "AnyIBRef"],
  ] as const)("maps compatibility mode %s to %s", (mode, expected) => {
    const yaml = mode === undefined ? {} : { РежимСовместимостиРасширенияКонфигурации: mode }

    expect(configurationExtensionTypeDescriptionXMLNameByType(yaml)).toEqual({
      AnyIBRef: expected,
    })
  })

  it("reports an unknown compatibility mode with its field name and value", () => {
    expect(() =>
      configurationExtensionTypeDescriptionXMLNameByType({
        РежимСовместимостиРасширенияКонфигурации: "Версия8_3_99",
      })
    ).toThrow("Неизвестный РежимСовместимостиРасширенияКонфигурации: Версия8_3_99")
  })
})
