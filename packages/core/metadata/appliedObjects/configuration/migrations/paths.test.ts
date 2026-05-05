import { describe, expect, it } from "vitest"
import { buildRenameTargetPath, parseMigrationPath } from "./paths"

describe("migration paths", () => {
  it("parses top level object paths", () => {
    expect(parseMigrationPath("Справочник.Товары")).toEqual({
      kind: "object",
      segments: ["Справочник", "Товары"],
      localName: "Товары",
      ownerPath: "Справочник",
      levelPath: "Справочник",
    })
  })

  it("parses tabular section attribute paths", () => {
    expect(parseMigrationPath("Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество")).toMatchObject({
      kind: "attribute",
      localName: "Количество",
      ownerPath: "Документ.Заказ.ТабличнаяЧасть.Товары",
      levelPath: "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит",
    })
  })

  it("builds rename target from local name", () => {
    expect(buildRenameTargetPath("Справочник.Товары.Реквизит.Артикул", "НовыйАртикул")).toBe(
      "Справочник.Товары.Реквизит.НовыйАртикул",
    )
    expect(buildRenameTargetPath("Справочник.Товары", "Номенклатура")).toBe("Справочник.Номенклатура")
  })

  it("rejects unsupported segments", () => {
    expect(() => parseMigrationPath("Справочник.Товары.Команда.Открыть")).toThrow("Неподдерживаемый путь миграции")
  })
})
