import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { buildMetadataOperationSnapshot } from "./projectSnapshot"
import { resolveMetadataOperationTarget } from "./targetResolver"

describe("resolveMetadataOperationTarget", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("resolves object and child targets with migration paths", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-target-resolver-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента"), { recursive: true })
    writeFileSync(
      join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
      ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n"),
    )
    writeFileSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml"), "Элементы: {}\n")

    const snapshot = buildMetadataOperationSnapshot({ projectDir, requireValidProject: false })
    expect(snapshot.ok).toBe(true)
    if (!snapshot.ok) return

    expect(resolveMetadataOperationTarget(snapshot, { kind: "object", itemTypePrefix: "Справочник", name: "Товары" })).toMatchObject({
      ok: true,
      displayPath: "Справочник.Товары",
      migrationPath: "Справочник.Товары",
      requiresMigration: true,
    })
    expect(
      resolveMetadataOperationTarget(snapshot, {
        kind: "attribute",
        owner: { itemTypePrefix: "Справочник", name: "Товары" },
        name: "Артикул",
      }),
    ).toMatchObject({
      ok: true,
      displayPath: "Справочник.Товары.Реквизит.Артикул",
      migrationPath: "Справочник.Товары.Реквизит.Артикул",
      requiresMigration: true,
    })
    expect(
      resolveMetadataOperationTarget(snapshot, {
        kind: "fileItem",
        owner: { itemTypePrefix: "Справочник", name: "Товары" },
        role: "form",
        name: "ФормаЭлемента",
      }),
    ).toMatchObject({
      ok: true,
      displayPath: "Справочник.Товары.Форма.ФормаЭлемента",
      requiresMigration: false,
    })
  })
})
