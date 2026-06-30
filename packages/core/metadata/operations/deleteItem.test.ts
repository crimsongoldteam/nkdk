import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { deleteMetadataItem } from "./deleteItem"

describe("deleteMetadataItem", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-delete-item-"))
    tempDirs.push(dir)
    return dir
  }

  function writeProjectFile(projectDir: string, projectPath: string, lines: string[]): string {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(join(filePath, ".."), { recursive: true })
    writeFileSync(filePath, lines.join("\n"))
    return filePath
  }

  it("returns validation_failed before looking for references", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ["НеизвестноеПоле: true"])

    const result = deleteMetadataItem({
      projectDir,
      target: { kind: "object", itemTypePrefix: "Справочник", name: "Товары" },
    })

    expect(result).toMatchObject({ ok: false, code: "validation_failed" })
  })

  it("blocks external references to deleted object descendants", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])
    writeProjectFile(projectDir, "Справочник/Заказы/Свойства.yaml", ["Владельцы:", "  - Справочник.Товары"])

    const result = deleteMetadataItem({
      projectDir,
      target: { kind: "object", itemTypePrefix: "Справочник", name: "Товары" },
    })

    expect(result).toMatchObject({
      ok: false,
      code: "references_found",
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences: [expect.objectContaining({ value: "Catalog.Товары" })],
    })
  })

  it("ignores references inside the deleted object subtree", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "ПоляБлокировкиДанных:",
      "  - Реквизит.Артикул",
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])

    const result = deleteMetadataItem({
      projectDir,
      target: { kind: "object", itemTypePrefix: "Справочник", name: "Товары" },
    })

    expect(result).toMatchObject({ ok: true, mode: "plan", blockedReferences: [] })
  })

  it("applies attribute deletion through model export without migration", () => {
    const projectDir = createProject()
    const propertiesPath = writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
      "  Код:",
      "    Тип: Строка",
    ])

    const result = deleteMetadataItem({
      projectDir,
      target: {
        kind: "attribute",
        owner: { itemTypePrefix: "Справочник", name: "Товары" },
        name: "Артикул",
      },
      allowWrite: true,
    })

    expect(result).toMatchObject({ ok: true, mode: "applied", createdMigration: undefined })
    const yaml = readFileSync(propertiesPath, "utf-8")
    expect(yaml).not.toContain("Артикул:")
    expect(yaml).toContain("Код:")
    expect(existsSync(join(projectDir, "Миграции"))).toBe(false)
  })

  it("deletes file item resources without migration", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ["{}"])
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", ["Элементы: {}"])

    const result = deleteMetadataItem({
      projectDir,
      target: {
        kind: "fileItem",
        owner: { itemTypePrefix: "Справочник", name: "Товары" },
        role: "form",
        name: "ФормаЭлемента",
      },
      allowWrite: true,
    })

    expect(result).toMatchObject({ ok: true, mode: "applied", createdMigration: undefined })
    expect(existsSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента"))).toBe(false)
    expect(existsSync(join(projectDir, "Миграции"))).toBe(false)
  })
})
