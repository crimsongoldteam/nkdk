import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { parseMetadataOperationPath } from "./operationPath"
import { buildMetadataOperationSnapshot } from "./projectSnapshot"
import { resolveMetadataOperationPath } from "./targetResolver"

describe("resolveMetadataOperationPath", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-target-resolver-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента"), { recursive: true })
    mkdirSync(join(projectDir, "Документ", "Заказ"), { recursive: true })
    writeFileSync(
      join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
      ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n")
    )
    writeFileSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml"), "Элементы: {}\n")
    writeFileSync(
      join(projectDir, "Документ", "Заказ", "Свойства.yaml"),
      ["ТабличныеЧасти:", "  Товары:", "    Реквизиты:", "      Количество:", "        Тип: Число"].join("\n")
    )
    return projectDir
  }

  async function resolve(projectDir: string, path: string) {
    const snapshot = await buildMetadataOperationSnapshot({ projectDir, requireValidProject: false })
    expect(snapshot.ok).toBe(true)
    if (!snapshot.ok) throw new Error("snapshot failed")
    const parsed = parseMetadataOperationPath(path)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) throw new Error(parsed.message)
    return resolveMetadataOperationPath(snapshot, parsed)
  }

  it("resolves object, child, nested child and file item targets", async () => {
    const projectDir = createProject()

    expect(await resolve(projectDir, "Справочник.Товары")).toMatchObject({
      ok: true,
      displayPath: "Справочник.Товары",
      migrationPath: "Справочник.Товары",
      requiresMigration: true,
      currentName: "Товары",
    })
    expect(await resolve(projectDir, "Справочник.Товары.Реквизит.Артикул")).toMatchObject({
      ok: true,
      displayPath: "Справочник.Товары.Реквизит.Артикул",
      migrationPath: "Справочник.Товары.Реквизит.Артикул",
      requiresMigration: true,
      currentName: "Артикул",
    })
    expect(await resolve(projectDir, "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество")).toMatchObject({
      ok: true,
      displayPath: "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество",
      migrationPath: "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество",
      requiresMigration: true,
      currentName: "Количество",
    })
    expect(await resolve(projectDir, "Справочник.Товары.Форма.ФормаЭлемента")).toMatchObject({
      ok: true,
      displayPath: "Справочник.Товары.Форма.ФормаЭлемента",
      requiresMigration: false,
      currentName: "ФормаЭлемента",
    })
  })

  it("distinguishes unsupported target and missing node", async () => {
    const projectDir = createProject()

    expect(await resolve(projectDir, "Справочник.Товары.Реквизит.НетТакого")).toMatchObject({
      ok: false,
      code: "target_not_found",
    })
    expect(await resolve(projectDir, "Справочник.Товары.ПредопределенныйЭлемент.БезНДС")).toMatchObject({
      ok: false,
      code: "unsupported_target",
    })
  })

  it("returns and renames the exact YAML collection node", async () => {
    const result = await resolve(createProject(), "Справочник.Товары.Реквизит.Артикул")
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.yamlNode).toEqual({ Тип: "Строка" })
    result.renameYaml("Код")
    expect(result.item.yaml).toMatchObject({ Реквизиты: { Код: { Тип: "Строка" } } })
  })
})
