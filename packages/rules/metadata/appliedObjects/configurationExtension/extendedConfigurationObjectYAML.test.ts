import { describe, expect, it } from "vitest"
import { exportToYAML, markYAMLScalarTag, parseMetadataYaml } from "@nkdk/runtime"
import {
  readExtendedConfigurationObjectYAML,
  writeExtendedConfigurationObjectYAML,
  type ExtendedConfigurationObjectState,
} from "./extendedConfigurationObjectYAML"

const field = "ОбъектРасширяемойКонфигурации"

describe("ExtendedConfigurationObject YAML", () => {
  it.each([
    [{ uuidPresent: true, mode: "control" }, ""],
    [{ uuidPresent: false, mode: "control" }, `${field}:`],
    [{ uuidPresent: true, mode: "notify" }, `${field}: !проверять`],
    [{ uuidPresent: false, mode: "notify" }, `${field}: !проверять \"\"`],
  ] as const)("кодирует состояние %#", (state, expectedYAML) => {
    const yaml: Record<string, unknown> = {}

    writeExtendedConfigurationObjectYAML(yaml, state)

    expect(exportToYAML(yaml)).toBe(expectedYAML)
    expect(readExtendedConfigurationObjectYAML(
      parseMetadataYaml(expectedYAML).data as Record<string, unknown>,
    )).toEqual(state)
  })

  it.each([
    ["Ложь", undefined],
    [false, undefined],
    ["Истина", undefined],
    [true, undefined],
    ["11111111-1111-4111-8111-111111111111", undefined],
    ["", undefined],
    [{}, "изменять"],
  ] as const)("отклоняет недопустимую форму %#", (value, tag) => {
    const yaml: Record<string, unknown> = { [field]: value }
    if (tag !== undefined) markYAMLScalarTag(yaml, field, tag)

    expect(() => readExtendedConfigurationObjectYAML(yaml)).toThrow(
      /ОбъектРасширяемойКонфигурации.*допустим/,
    )
  })

  it("не изменяет остальные поля YAML", () => {
    const yaml: Record<string, unknown> = { Имя: "Расширение" }
    const state: ExtendedConfigurationObjectState = {
      uuidPresent: false,
      mode: "control",
    }

    writeExtendedConfigurationObjectYAML(yaml, state)

    expect(yaml).toMatchObject({ Имя: "Расширение" })
  })
})
