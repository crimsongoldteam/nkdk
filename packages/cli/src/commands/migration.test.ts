import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it, vi } from "vitest"
import { deleteMigration, renameMigration } from "./migration"

describe("migration commands", () => {
  it("creates rename migration with local new name", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    const log = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    renameMigration(yamlDir, "Справочник.Товары.Реквизит.Артикул", "НовыйАртикул", new Date("2026-05-05T14:30:00.000Z"))

    const filePath = join(yamlDir, "Миграции", "2026-05-05-143000.yaml")
    expect(fs.readFileSync(filePath, "utf-8")).toBe('"Справочник.Товары.Реквизит.Артикул": НовыйАртикул\n')
    expect(log).toHaveBeenCalledWith(filePath + "\n")
    log.mockRestore()
  })

  it("rejects rename no-op and names with dot", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    expect(() => renameMigration(yamlDir, "Справочник.Товары", "Товары")).toThrow("Переименование в то же имя запрещено")
    expect(() => renameMigration(yamlDir, "Справочник.Товары", "Новые.Товары")).toThrow("Новое имя не должно содержать точку")
  })

  it("creates delete migration", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    deleteMigration(yamlDir, "Справочник.Товары.Реквизит.СтароеПоле", new Date("2026-05-05T14:30:00.000Z"))

    expect(fs.readFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), "utf-8")).toBe(
      '"Справочник.Товары.Реквизит.СтароеПоле": Удалить\n',
    )
  })
})
