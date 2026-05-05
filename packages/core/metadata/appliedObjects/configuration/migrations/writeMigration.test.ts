import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { writeMigrationFile } from "./writeMigration"

describe("writeMigrationFile", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("writes next migration file when a migration already exists", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    fs.mkdirSync(join(yamlDir, "Миграции"))
    fs.writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), "")

    const filePath = writeMigrationFile({
      yamlDir,
      entries: [{ path: "Справочник.Товары", value: "Номенклатура" }],
      now: new Date("2026-05-05T09:00:00.000Z"),
    })

    expect(filePath).toBe(join(yamlDir, "Миграции", "2026-05-05-143001.yaml"))
    expect(fs.readFileSync(filePath, "utf-8")).toBe('"Справочник.Товары": Номенклатура\n')
  })

  it("keeps entry order in the migration file", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))

    const filePath = writeMigrationFile({
      yamlDir,
      entries: [
        { path: "Справочник.Товары", value: "Номенклатура" },
        { path: "Справочник.Товары.Реквизит.Артикул", value: "НовыйАртикул" },
        { path: "Документ.Заказ", value: "ЗаказКлиента" },
      ],
      now: new Date("2026-05-05T14:30:00.000Z"),
    })

    expect(fs.readFileSync(filePath, "utf-8")).toBe(
      '"Справочник.Товары": Номенклатура\n' +
        '"Справочник.Товары.Реквизит.Артикул": НовыйАртикул\n' +
        '"Документ.Заказ": ЗаказКлиента\n',
    )
  })

  it("writes following file without overwriting when first calculated file appears concurrently", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    const migrationsDir = join(yamlDir, "Миграции")
    const firstPath = join(migrationsDir, "2026-05-05-143000.yaml")
    const originalWriteFileSync = fs.writeFileSync

    vi.spyOn(fs, "writeFileSync").mockImplementation((path, data, options) => {
      if (path === firstPath) {
        originalWriteFileSync(firstPath, '"Справочник.Старое": Старое\n', "utf-8")
        const error = new Error("file exists") as NodeJS.ErrnoException
        error.code = "EEXIST"
        throw error
      }
      return originalWriteFileSync(path, data, options)
    })

    const filePath = writeMigrationFile({
      yamlDir,
      entries: [{ path: "Справочник.Товары", value: "Номенклатура" }],
      now: new Date("2026-05-05T14:30:00.000Z"),
    })

    expect(filePath).toBe(join(migrationsDir, "2026-05-05-143001.yaml"))
    expect(fs.readFileSync(firstPath, "utf-8")).toBe('"Справочник.Старое": Старое\n')
    expect(fs.readFileSync(filePath, "utf-8")).toBe('"Справочник.Товары": Номенклатура\n')
  })
})
