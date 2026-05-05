import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { select } from "@inquirer/prompts"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { deleteMigration, generateMigration, renameMigration } from "./migration"

vi.mock("@inquirer/prompts", () => ({
  select: vi.fn(),
}))

const selectMock = vi.mocked(select)

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
  beforeEach(() => {
    selectMock.mockReset()
  })

  afterEach(() => vi.restoreAllMocks())

  it("dry-run exits with code 1 when conflicts remain", async () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    const xmlDir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    const log = vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
    fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), "")
    fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20"><Catalog uuid="00000000-0000-0000-0000-000000000001"><Properties><Name>Товары</Name><Synonym/><Comment/></Properties></Catalog></MetaDataObject>`)

    const result = await generateMigration({ yamlDir, xmlDir, dryRun: true })
    expect(result.exitCode).toBe(1)
    expect(result.filePath).toBeUndefined()
    expect(result.conflicts[0]?.levelPath).toBe("Справочник")
    expect(fs.existsSync(join(yamlDir, "Миграции"))).toBe(false)
    expect(log).not.toHaveBeenCalled()
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

  it("creates rename migration from selected added item", async () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    const xmlDir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    const log = vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    selectMock.mockResolvedValue("Номенклатура")
    fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
    fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), "")
    fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), catalogXML("Товары"))

    const now = new Date("2026-05-05T14:30:00.000Z")
    const result = await generateMigration({ yamlDir, xmlDir, dryRun: false, now })

    const filePath = join(yamlDir, "Миграции", "2026-05-05-143000.yaml")
    expect(result.exitCode).toBe(0)
    expect(result.filePath).toBe(filePath)
    expect(fs.readFileSync(filePath, "utf-8")).toBe('"Справочник.Товары": Номенклатура\n')
    expect(log).toHaveBeenCalledWith(filePath + "\n")
  })

  it("continues with child conflicts after parent rename selection", async () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    const xmlDir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    selectMock.mockResolvedValueOnce("Номенклатура").mockResolvedValueOnce("НовыйАртикул")
    fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
    fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), [
      "Реквизиты:",
      "  НовыйАртикул:",
      "    Тип: string",
      "",
    ].join("\n"))
    fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), catalogXMLWithAttribute("Товары", "Артикул"))

    await generateMigration({
      yamlDir,
      xmlDir,
      dryRun: false,
      now: new Date("2026-05-05T14:30:00.000Z"),
    })

    expect(fs.readFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), "utf-8")).toBe(
      '"Справочник.Товары": Номенклатура\n"Справочник.Номенклатура.Реквизит.Артикул": НовыйАртикул\n',
    )
    expect(selectMock).toHaveBeenCalledTimes(2)
  })

  it("creates delete and leftover add migration when delete is selected", async () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    const xmlDir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    selectMock.mockResolvedValue("Удалить")
    fs.mkdirSync(join(yamlDir, "Справочник", "Новый"), { recursive: true })
    fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "Справочник", "Новый", "Свойства.yaml"), "")
    fs.writeFileSync(join(xmlDir, "Catalogs", "Старый.xml"), catalogXML("Старый"))

    const result = await generateMigration({
      yamlDir,
      xmlDir,
      dryRun: false,
      now: new Date("2026-05-05T14:30:00.000Z"),
    })

    expect(result.exitCode).toBe(0)
    expect(fs.readFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), "utf-8")).toBe(
      '"Справочник.Старый": Удалить\n"Справочник.Новый": Добавить\n',
    )
  })

  it("removes selected added item from later choices and leftovers", async () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    const xmlDir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    selectMock.mockResolvedValueOnce("Новый1").mockResolvedValueOnce("Удалить")
    fs.mkdirSync(join(yamlDir, "Справочник", "Новый1"), { recursive: true })
    fs.mkdirSync(join(yamlDir, "Справочник", "Новый2"), { recursive: true })
    fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "Справочник", "Новый1", "Свойства.yaml"), "")
    fs.writeFileSync(join(yamlDir, "Справочник", "Новый2", "Свойства.yaml"), "")
    fs.writeFileSync(join(xmlDir, "Catalogs", "Старый1.xml"), catalogXML("Старый1"))
    fs.writeFileSync(join(xmlDir, "Catalogs", "Старый2.xml"), catalogXML("Старый2"))

    await generateMigration({
      yamlDir,
      xmlDir,
      dryRun: false,
      now: new Date("2026-05-05T14:30:00.000Z"),
    })

    expect(fs.readFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), "utf-8")).toBe(
      '"Справочник.Старый1": Новый1\n"Справочник.Старый2": Удалить\n"Справочник.Новый2": Добавить\n',
    )
    expect(selectMock).toHaveBeenCalledTimes(2)
    expect(selectMock.mock.calls[1]?.[0].choices).toEqual([
      { name: "Новый2", value: "Новый2" },
      { name: "Удалить", value: "Удалить" },
    ])
  })
})

function catalogXML(name: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20"><Catalog uuid="00000000-0000-0000-0000-000000000001"><Properties><Name>${name}</Name><Synonym/><Comment/></Properties></Catalog></MetaDataObject>`
}

function catalogXMLWithAttribute(name: string, attributeName: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20"><Catalog uuid="00000000-0000-0000-0000-000000000001"><Properties><Name>${name}</Name><Synonym/><Comment/></Properties><ChildObjects><Attribute uuid="00000000-0000-0000-0000-000000000002"><Properties><Name>${attributeName}</Name><Synonym/><Comment/><Type><v8:Type>xs:string</v8:Type><v8:StringQualifiers><v8:Length>0</v8:Length><v8:AllowedLength>Variable</v8:AllowedLength></v8:StringQualifiers></Type></Properties></Attribute></ChildObjects></Catalog></MetaDataObject>`
}
