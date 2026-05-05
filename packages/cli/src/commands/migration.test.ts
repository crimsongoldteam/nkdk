import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { deleteMigration, generateMigration, renameMigration } from "./migration"

describe("migration commands", () => {
  afterEach(() => vi.restoreAllMocks())

  it("creates rename migration with local new name", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    const log = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    renameMigration(yamlDir, "Справочник.Товары.Реквизит.Артикул", "НовыйАртикул", new Date("2026-05-05T14:30:00.000Z"))

    const filePath = join(yamlDir, "Миграции", "2026-05-05-143000.yaml")
    expect(fs.readFileSync(filePath, "utf-8")).toBe('"Справочник.Товары.Реквизит.Артикул": НовыйАртикул\n')
    expect(log).toHaveBeenCalledWith(filePath + "\n")
  })

  it("rejects rename no-op and names with dot", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    expect(() => renameMigration(yamlDir, "Справочник.Товары", "Товары")).toThrow("Переименование в то же имя запрещено")
    expect(() => renameMigration(yamlDir, "Справочник.Товары", "Новые.Товары")).toThrow("Новое имя не должно содержать точку")
  })

  it("creates delete migration", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    const log = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    deleteMigration(yamlDir, "Справочник.Товары.Реквизит.СтароеПоле", new Date("2026-05-05T14:30:00.000Z"))

    const filePath = join(yamlDir, "Миграции", "2026-05-05-143000.yaml")
    expect(fs.readFileSync(filePath, "utf-8")).toBe(
      '"Справочник.Товары.Реквизит.СтароеПоле": Удалить\n',
    )
    expect(log).toHaveBeenCalledWith(filePath + "\n")
  })
})

describe("generateMigration", () => {
  it("dry-run exits with code 1 when conflicts remain", async () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    const xmlDir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
    fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), "")
    fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20"><Catalog uuid="00000000-0000-0000-0000-000000000001"><Properties><Name>Товары</Name><Synonym/><Comment/></Properties></Catalog></MetaDataObject>`)

    const result = await generateMigration({ yamlDir, xmlDir, dryRun: true })
    expect(result.exitCode).toBe(1)
    expect(result.filePath).toBeUndefined()
    expect(result.conflicts[0]?.levelPath).toBe("Справочник")
  })

  it("does not create a file when no migration is needed", async () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    const xmlDir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    fs.mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "")

    const result = await generateMigration({ yamlDir, xmlDir, dryRun: false })
    expect(result.exitCode).toBe(0)
    expect(result.filePath).toBeUndefined()
  })
})
