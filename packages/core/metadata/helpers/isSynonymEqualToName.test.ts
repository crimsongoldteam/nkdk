import { describe, expect, it } from "vitest"
import { isSynonymEqualToName } from "./isSynonymEqualToName"

describe("isSynonymEqualToName", () => {
  it("should return true when synonym string matches name in PascalCase", () => {
    const synonym = "Тестовый реквизит"
    const result = isSynonymEqualToName(synonym, "ТестовыйРеквизит")
    expect(result).toBe(true)
  })

  it("should return false when synonym string does not match name in PascalCase", () => {
    const synonym = "Какой-то тестовый реквизит"
    const result = isSynonymEqualToName(synonym, "ТестовыйРеквизит")
    expect(result).toBe(false)
  })

  it("should return false when synonym is undefined", () => {
    const result = isSynonymEqualToName(undefined, "ТестовыйРеквизит")
    expect(result).toBe(false)
  })

  it("should return false when synonym is an object with multiple languages", () => {
    const synonym = { ru: "Тестовый реквизит", en: "Test attribute" }
    const result = isSynonymEqualToName(synonym, "ТестовыйРеквизит")
    expect(result).toBe(false)
  })
})
