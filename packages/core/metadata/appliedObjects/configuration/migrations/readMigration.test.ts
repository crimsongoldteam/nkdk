import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { readMigrationFile, readPendingMigrationEntries } from "./readMigration"

describe("readMigration", () => {
  it("reads one flat string map entry", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-migrations-"))
    const path = join(dir, "2026-05-05-143000.yaml")
    fs.writeFileSync(path, '"Справочник.Товары": "Номенклатура"\n')

    expect(readMigrationFile(path)).toEqual([{ path: "Справочник.Товары", value: "Номенклатура" }])
  })

  it("rejects multiple entries", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-migrations-"))
    const path = join(dir, "2026-05-05-143000.yaml")
    fs.writeFileSync(path, '"Справочник.Товары": "Номенклатура"\n"Справочник.Номенклатура": Удалить\n')

    expect(() => readMigrationFile(path)).toThrow("Файл миграции должен содержать ровно одно переименование")
  })

  it("rejects empty and non-string values", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-migrations-"))
    const emptyPath = join(dir, "empty.yaml")
    const numericPath = join(dir, "numeric.yaml")
    fs.writeFileSync(emptyPath, '"Справочник.Товары":\n')
    fs.writeFileSync(numericPath, '"Справочник.Товары": 1\n')

    expect(() => readMigrationFile(emptyPath)).toThrow("Значение миграции должно быть непустой строкой")
    expect(() => readMigrationFile(numericPath)).toThrow("Значение миграции должно быть непустой строкой")
  })

  it("ignores applied migrations and absent applied files", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    fs.mkdirSync(join(yamlDir, "Миграции"))
    fs.writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), '"Справочник.Товары": "Номенклатура"\n')
    fs.writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143001.yaml"), '"Справочник.Номенклатура": Удалить\n')

    expect(readPendingMigrationEntries(yamlDir, {
      applied: ["2026-05-05-143000.yaml", "2026-05-05-142000.yaml"],
    })).toEqual([
      {
        fileName: "2026-05-05-143001.yaml",
        entries: [{ path: "Справочник.Номенклатура", value: "Удалить" }],
      },
    ])
  })
})
