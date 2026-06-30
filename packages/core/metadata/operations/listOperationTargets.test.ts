import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { listMetadataOperationTargets } from "./listOperationTargets"

describe("listMetadataOperationTargets", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-operation-targets-"))
    tempDirs.push(dir)
    return dir
  }

  function writeProjectFile(projectDir: string, projectPath: string, lines: string[]): void {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(join(filePath, ".."), { recursive: true })
    writeFileSync(filePath, lines.join("\n"))
  }

  it("lists object, named collection and file item targets without requiring full validation", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
      "ТабличныеЧасти:",
      "  Остатки:",
      "    Реквизиты:",
      "      Количество:",
      "        Тип: Число",
    ])
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "ЛишнееПоле: true",
      "Элементы: {}",
    ])

    const result = listMetadataOperationTargets({ projectDir })

    expect(result.ok).toBe(true)
    expect(result.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          displayPath: "Справочник.Товары",
          target: { kind: "object", itemTypePrefix: "Справочник", name: "Товары" },
          requiresMigration: true,
        }),
        expect.objectContaining({
          displayPath: "Справочник.Товары.Реквизит.Артикул",
          target: { kind: "attribute", owner: { itemTypePrefix: "Справочник", name: "Товары" }, name: "Артикул" },
          requiresMigration: true,
        }),
        expect.objectContaining({
          displayPath: "Справочник.Товары.Форма.ФормаЭлемента",
          target: {
            kind: "fileItem",
            owner: { itemTypePrefix: "Справочник", name: "Товары" },
            role: "form",
            name: "ФормаЭлемента",
          },
          requiresMigration: false,
        }),
      ]),
    )
  })

  it("filters by query, kind and owner", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ["Реквизиты:", "  Артикул:", "    Тип: Строка"])
    writeProjectFile(projectDir, "Справочник/Склады/Свойства.yaml", [])

    const result = listMetadataOperationTargets({
      projectDir,
      query: "арт",
      kind: "attribute",
      owner: { itemTypePrefix: "Справочник", name: "Товары" },
      limit: 5,
    })

    expect(result.ok).toBe(true)
    expect(result.targets.map((item) => item.displayPath)).toEqual(["Справочник.Товары.Реквизит.Артикул"])
  })
})
