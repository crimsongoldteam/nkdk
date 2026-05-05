import { describe, expect, it } from "vitest"
import { applyMigrationEntries, applyPendingMigrationFiles } from "./applyMigrations"
import type { MigrationEntry, StructuralKind, StructuralState } from "./types"

function state(paths: string[]): StructuralState {
  return {
    nodes: new Map(
      paths.map((path) => [
        path,
        {
          path,
          kind: kindByPath(path),
          name: path.split(".").at(-1)!,
          referencePath: path,
        },
      ]),
    ),
  }
}

function kindByPath(path: string): StructuralKind {
  if (path.includes(".Реквизит.")) return "attribute"
  if (path.includes(".ТабличнаяЧасть.")) return "tabularSection"
  if (path.includes(".Измерение.")) return "dimension"
  return "object"
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

  it("deletes path with descendants", () => {
    const result = applyMigrationEntries(
      state([
        "Справочник.Товары",
        "Справочник.Товары.Реквизит.Артикул",
        "Справочник.Склады",
        "Справочник.Склады.Реквизит.Код",
      ]),
      [{ path: "Справочник.Товары", value: "Удалить" }],
    )

    expect([...result.state.nodes.keys()].sort()).toEqual(["Справочник.Склады", "Справочник.Склады.Реквизит.Код"])
  })

  it("does not mutate initial state", () => {
    const initial = state(["Справочник.Товары", "Справочник.Товары.Реквизит.Артикул"])

    applyMigrationEntries(initial, [{ path: "Справочник.Товары", value: "Номенклатура" }])

    expect([...initial.nodes.keys()].sort()).toEqual(["Справочник.Товары", "Справочник.Товары.Реквизит.Артикул"])
    expect(initial.nodes.get("Справочник.Товары")?.path).toBe("Справочник.Товары")
    expect(initial.nodes.get("Справочник.Товары")?.name).toBe("Товары")
  })

  it("rejects rename when target exists in intermediate state", () => {
    expect(() =>
      applyMigrationEntries(
        state(["Справочник.Товары.Реквизит.Старый", "Справочник.Товары.Реквизит.Новый"]),
        [{ path: "Справочник.Товары.Реквизит.Старый", value: "Новый" }],
      ),
    ).toThrow('Целевой путь уже существует "Справочник.Товары.Реквизит.Новый"')
  })

  it("rejects rename when target descendant exists in intermediate state", () => {
    expect(() =>
      applyMigrationEntries(
        state(["Справочник.Товары", "Справочник.Номенклатура.Реквизит.Артикул"]),
        [{ path: "Справочник.Товары", value: "Номенклатура" }],
      ),
    ).toThrow('Целевой путь уже существует "Справочник.Номенклатура"')
  })

  it("rejects rename of missing path", () => {
    expect(() =>
      applyMigrationEntries(state([]), [{ path: "Справочник.Товары.Реквизит.Артикул", value: "НовыйАртикул" }]),
    ).toThrow('Путь для переименования не найден "Справочник.Товары.Реквизит.Артикул"')
  })

  it("rejects delete of missing path", () => {
    expect(() =>
      applyMigrationEntries(state([]), [{ path: "Справочник.Товары.Реквизит.Артикул", value: "Удалить" }]),
    ).toThrow('Путь для удаления не найден "Справочник.Товары.Реквизит.Артикул"')
  })

  it("rejects add of existing path", () => {
    expect(() =>
      applyMigrationEntries(state(["Справочник.Товары.Реквизит.Артикул"]), [
        { path: "Справочник.Товары.Реквизит.Артикул", value: "Добавить" },
      ]),
    ).toThrow('Путь для добавления уже существует "Справочник.Товары.Реквизит.Артикул"')
  })

  it("rejects invalid migration value", () => {
    expect(() =>
      applyMigrationEntries(state(["Справочник.Товары.Реквизит.Артикул"]), [
        { path: "Справочник.Товары.Реквизит.Артикул", value: null },
      ] as unknown as MigrationEntry[]),
    ).toThrow('Некорректное значение миграции для "Справочник.Товары.Реквизит.Артикул"')
  })
})

describe("applyPendingMigrationFiles", () => {
  it("applies files in order and returns applied file names", () => {
    const result = applyPendingMigrationFiles(state(["Справочник.Товары"]), [
      {
        fileName: "2026-05-05-143000.yaml",
        entries: [{ path: "Справочник.Товары", value: "Номенклатура" }],
      },
      {
        fileName: "2026-05-05-143001.yaml",
        entries: [{ path: "Справочник.Номенклатура.Реквизит.Артикул", value: "Добавить" }],
      },
    ])

    expect([...result.state.nodes.keys()].sort()).toEqual([
      "Справочник.Номенклатура",
      "Справочник.Номенклатура.Реквизит.Артикул",
    ])
    expect(result.referencePathByCurrentPath.get("Справочник.Номенклатура")).toBe("Справочник.Товары")
    expect(result.appliedFileNames).toEqual(["2026-05-05-143000.yaml", "2026-05-05-143001.yaml"])
  })

  it("preserves descendant reference paths across sequential file renames", () => {
    const result = applyPendingMigrationFiles(state(["Справочник.Товары", "Справочник.Товары.Реквизит.Артикул"]), [
      {
        fileName: "2026-05-05-143000.yaml",
        entries: [{ path: "Справочник.Товары", value: "Номенклатура" }],
      },
      {
        fileName: "2026-05-05-143001.yaml",
        entries: [{ path: "Справочник.Номенклатура.Реквизит.Артикул", value: "НовыйАртикул" }],
      },
    ])

    expect([...result.state.nodes.keys()].sort()).toEqual([
      "Справочник.Номенклатура",
      "Справочник.Номенклатура.Реквизит.НовыйАртикул",
    ])
    expect(result.referencePathByCurrentPath.get("Справочник.Номенклатура.Реквизит.НовыйАртикул")).toBe(
      "Справочник.Товары.Реквизит.Артикул",
    )
    expect(result.appliedFileNames).toEqual(["2026-05-05-143000.yaml", "2026-05-05-143001.yaml"])
  })
})
