import { describe, expect, it } from "vitest"
import { applyMigrationEntries } from "./applyMigrations"
import type { StructuralState } from "./types"

function state(paths: string[]): StructuralState {
  return {
    nodes: new Map(
      paths.map((path) => [
        path,
        {
          path,
          kind: path.includes("ТабличнаяЧасть") ? "tabularSection" : path.includes("Реквизит") ? "attribute" : "object",
          name: path.split(".").at(-1)!,
          referencePath: path,
        },
      ]),
    ),
  }
}

describe("applyMigrationEntries", () => {
  it("renames parent and descendants while preserving original reference paths", () => {
    const result = applyMigrationEntries(
      state(["Справочник.Товары", "Справочник.Товары.Реквизит.Артикул"]),
      [
        { path: "Справочник.Товары", value: "Номенклатура" },
        { path: "Справочник.Номенклатура.Реквизит.Артикул", value: "НовыйАртикул" },
      ],
    )

    expect([...result.state.nodes.keys()].sort()).toEqual([
      "Справочник.Номенклатура",
      "Справочник.Номенклатура.Реквизит.НовыйАртикул",
    ])
    expect(result.referencePathByCurrentPath.get("Справочник.Номенклатура")).toBe("Справочник.Товары")
    expect(result.referencePathByCurrentPath.get("Справочник.Номенклатура.Реквизит.НовыйАртикул")).toBe(
      "Справочник.Товары.Реквизит.Артикул",
    )
  })

  it("supports delete then add of the same path as recreation", () => {
    const result = applyMigrationEntries(state(["Справочник.Товары.Реквизит.Артикул"]), [
      { path: "Справочник.Товары.Реквизит.Артикул", value: "Удалить" },
      { path: "Справочник.Товары.Реквизит.Артикул", value: "Добавить" },
    ])

    expect(result.state.nodes.has("Справочник.Товары.Реквизит.Артикул")).toBe(true)
    expect(result.referencePathByCurrentPath.has("Справочник.Товары.Реквизит.Артикул")).toBe(false)
  })

  it("rejects rename when target exists in intermediate state", () => {
    expect(() =>
      applyMigrationEntries(
        state(["Справочник.Товары.Реквизит.Старый", "Справочник.Товары.Реквизит.Новый"]),
        [{ path: "Справочник.Товары.Реквизит.Старый", value: "Новый" }],
      ),
    ).toThrow('Целевой путь уже существует "Справочник.Товары.Реквизит.Новый"')
  })

  it("rejects delete of missing path", () => {
    expect(() =>
      applyMigrationEntries(state([]), [{ path: "Справочник.Товары.Реквизит.Артикул", value: "Удалить" }]),
    ).toThrow('Путь для удаления не найден "Справочник.Товары.Реквизит.Артикул"')
  })
})
