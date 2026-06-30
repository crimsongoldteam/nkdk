import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { renameMetadataItem } from "./renameItem"

describe("renameMetadataItem", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-rename-item-"))
    tempDirs.push(dir)
    return dir
  }

  function writeProjectFile(projectDir: string, projectPath: string, lines: string[]): string {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(join(filePath, ".."), { recursive: true })
    writeFileSync(filePath, lines.join("\n"))
    return filePath
  }

  it("returns validation_failed before invalid_name when project has validation errors", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ["НеизвестноеПоле: true"])

    const result = renameMetadataItem({
      projectDir,
      target: { kind: "object", itemTypePrefix: "Справочник", name: "Товары" },
      newName: "Некорректное имя",
    })

    expect(result).toMatchObject({ ok: false, code: "validation_failed" })
    expect(existsSync(join(projectDir, "Миграции"))).toBe(false)
  })

  it("plans object rename with migration and descendant reference rewrite", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "ПоляБлокировкиДанных:",
      "  - Реквизит.Артикул",
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])

    const result = renameMetadataItem({
      projectDir,
      target: { kind: "object", itemTypePrefix: "Справочник", name: "Товары" },
      newName: "Номенклатура",
    })

    expect(result).toMatchObject({
      ok: true,
      mode: "plan",
      createdMigration: { from: "Справочник.Товары", to: "Справочник.Номенклатура" },
      rewrittenReferences: [
        {
          from: "Catalog.Товары.Attribute.Артикул",
          to: "Catalog.Номенклатура.Attribute.Артикул",
        },
      ],
    })
  })

  it("applies attribute rename through model export and writes a migration file", () => {
    const projectDir = createProject()
    const propertiesPath = writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])

    const result = renameMetadataItem({
      projectDir,
      target: {
        kind: "attribute",
        owner: { itemTypePrefix: "Справочник", name: "Товары" },
        name: "Артикул",
      },
      newName: "КодПоставщика",
      allowWrite: true,
      now: new Date("2026-06-30T12:00:00.000Z"),
    })

    expect(result).toMatchObject({
      ok: true,
      mode: "applied",
      createdMigration: {
        from: "Справочник.Товары.Реквизит.Артикул",
        to: "Справочник.Товары.Реквизит.КодПоставщика",
        fileName: "2026-06-30-120000.yaml",
      },
    })
    const yaml = readFileSync(propertiesPath, "utf-8")
    expect(yaml).toContain("КодПоставщика:")
    expect(yaml).not.toContain("Артикул:")
    expect(readFileSync(join(projectDir, "Миграции", "2026-06-30-120000.yaml"), "utf-8")).toContain(
      '"Справочник.Товары.Реквизит.Артикул": КодПоставщика',
    )
  })

  it("allows case-only rename and blocks case-insensitive sibling conflicts", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
      "  Код:",
      "    Тип: Строка",
    ])

    expect(
      renameMetadataItem({
        projectDir,
        target: {
          kind: "attribute",
          owner: { itemTypePrefix: "Справочник", name: "Товары" },
          name: "Артикул",
        },
        newName: "артикул",
      }),
    ).toMatchObject({ ok: true, mode: "plan" })

    expect(
      renameMetadataItem({
        projectDir,
        target: {
          kind: "attribute",
          owner: { itemTypePrefix: "Справочник", name: "Товары" },
          name: "Артикул",
        },
        newName: "код",
      }),
    ).toMatchObject({ ok: false, code: "name_conflict" })
  })

  it("renames file item without migration and rewrites form references", () => {
    const projectDir = createProject()
    const propertiesPath = writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "ОсновнаяФормаОбъекта: ФормаЭлемента",
    ])
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", ["Элементы: {}"])

    const result = renameMetadataItem({
      projectDir,
      target: {
        kind: "fileItem",
        owner: { itemTypePrefix: "Справочник", name: "Товары" },
        role: "form",
        name: "ФормаЭлемента",
      },
      newName: "ФормаКарточки",
      allowWrite: true,
    })

    expect(result).toMatchObject({ ok: true, mode: "applied", createdMigration: undefined })
    expect(existsSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаКарточки", "Форма.yaml"))).toBe(true)
    expect(existsSync(join(projectDir, "Миграции"))).toBe(false)
    expect(readFileSync(propertiesPath, "utf-8")).toContain("ОсновнаяФормаОбъекта: ФормаКарточки")
  })
})
