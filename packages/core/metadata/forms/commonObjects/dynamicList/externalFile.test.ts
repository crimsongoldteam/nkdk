import fs from "fs"
import os from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { buildExternalFileEntry, readExternalFile } from "./externalFile"

const rule = { dir: "ДинамическийСписок", extension: "query", nameFrom: "parent" as const }

describe("buildExternalFileEntry", () => {
  it("returns null when value is undefined", () => {
    const result = buildExternalFileEntry(rule, "МойРеквизит", undefined)
    expect(result).toBeNull()
  })

  it("returns entry with correct relativePath and content when value is a string", () => {
    const result = buildExternalFileEntry(rule, "МойРеквизит", "ВЫБРАТЬ * ИЗ Справочник1")
    expect(result).toEqual({
      relativePath: "ДинамическийСписок/МойРеквизит.query",
      content: "ВЫБРАТЬ * ИЗ Справочник1",
    })
  })

  it("returns entry with empty content when value is empty string", () => {
    const result = buildExternalFileEntry(rule, "МойРеквизит", "")
    expect(result).toEqual({
      relativePath: "ДинамическийСписок/МойРеквизит.query",
      content: "",
    })
  })

  it("uses parentName in the file path (nameFrom: parent)", () => {
    const result = buildExternalFileEntry(rule, "ПроизвольныйЗапросМинимум", "текст запроса")
    expect(result?.relativePath).toBe("ДинамическийСписок/ПроизвольныйЗапросМинимум.query")
  })

  it("uses dir and extension from rule", () => {
    const customRule = { dir: "Модули", extension: "bsl", nameFrom: "parent" as const }
    const result = buildExternalFileEntry(customRule, "МодульОбъекта", "// код модуля")
    expect(result?.relativePath).toBe("Модули/МодульОбъекта.bsl")
  })
})

describe("readExternalFile", () => {
  it("returns content when file exists", () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "nakidka-test-"))
    try {
      fs.mkdirSync(join(tmpDir, "ДинамическийСписок"))
      fs.writeFileSync(join(tmpDir, "ДинамическийСписок", "МойРеквизит.query"), "ВЫБРАТЬ * ИЗ Справочник1", "utf-8")
      const result = readExternalFile(rule, "МойРеквизит", tmpDir)
      expect(result).toBe("ВЫБРАТЬ * ИЗ Справочник1")
    } finally {
      fs.rmSync(tmpDir, { recursive: true })
    }
  })

  it("returns empty string when file is empty", () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "nakidka-test-"))
    try {
      fs.mkdirSync(join(tmpDir, "ДинамическийСписок"))
      fs.writeFileSync(join(tmpDir, "ДинамическийСписок", "МойРеквизит.query"), "", "utf-8")
      const result = readExternalFile(rule, "МойРеквизит", tmpDir)
      expect(result).toBe("")
    } finally {
      fs.rmSync(tmpDir, { recursive: true })
    }
  })

  it("returns undefined when file does not exist", () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "nakidka-test-"))
    try {
      fs.mkdirSync(join(tmpDir, "ДинамическийСписок"))
      const result = readExternalFile(rule, "НесуществующийРеквизит", tmpDir)
      expect(result).toBeUndefined()
    } finally {
      fs.rmSync(tmpDir, { recursive: true })
    }
  })

  it("returns undefined when directory does not exist", () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "nakidka-test-"))
    try {
      // Не создаём ДинамическийСписок/
      const result = readExternalFile(rule, "МойРеквизит", tmpDir)
      expect(result).toBeUndefined()
    } finally {
      fs.rmSync(tmpDir, { recursive: true })
    }
  })
})
