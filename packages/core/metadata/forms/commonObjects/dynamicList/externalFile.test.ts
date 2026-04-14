import { describe, expect, it } from "vitest"
import { buildExternalFileEntry } from "./externalFile"

const rule = { dir: "ДинамическийСписок", extension: "bsl", nameFrom: "parent" as const }

describe("buildExternalFileEntry", () => {
  it("returns null when value is undefined", () => {
    const result = buildExternalFileEntry(rule, "МойРеквизит", undefined)
    expect(result).toBeNull()
  })

  it("returns entry with correct relativePath and content when value is a string", () => {
    const result = buildExternalFileEntry(rule, "МойРеквизит", "ВЫБРАТЬ * ИЗ Справочник1")
    expect(result).toEqual({
      relativePath: "ДинамическийСписок/МойРеквизит.bsl",
      content: "ВЫБРАТЬ * ИЗ Справочник1",
    })
  })

  it("returns entry with empty content when value is empty string", () => {
    const result = buildExternalFileEntry(rule, "МойРеквизит", "")
    expect(result).toEqual({
      relativePath: "ДинамическийСписок/МойРеквизит.bsl",
      content: "",
    })
  })

  it("uses parentName in the file path (nameFrom: parent)", () => {
    const result = buildExternalFileEntry(rule, "ПроизвольныйЗапросМинимум", "текст запроса")
    expect(result?.relativePath).toBe("ДинамическийСписок/ПроизвольныйЗапросМинимум.bsl")
  })

  it("uses dir and extension from rule", () => {
    const customRule = { dir: "Модули", extension: "bsl", nameFrom: "parent" as const }
    const result = buildExternalFileEntry(customRule, "МодульОбъекта", "// код модуля")
    expect(result?.relativePath).toBe("Модули/МодульОбъекта.bsl")
  })
})
