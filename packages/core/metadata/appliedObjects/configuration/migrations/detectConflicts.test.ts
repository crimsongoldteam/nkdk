import { describe, expect, it } from "vitest"
import { detectMigrationConflicts } from "./detectConflicts"
import type { StructuralState } from "./types"

function state(paths: string[]): StructuralState {
  return {
    nodes: new Map(paths.map((path) => [path, {
      path,
      kind: path.includes("Реквизит") ? "attribute" : "object",
      name: path.split(".").at(-1)!,
      referencePath: path,
    }])),
  }
}

describe("detectMigrationConflicts", () => {
  it("allows pure additions and pure deletions", () => {
    expect(detectMigrationConflicts(state(["Справочник.Товары"]), state([]))).toEqual([])
    expect(detectMigrationConflicts(state([]), state(["Справочник.Товары"]))).toEqual([])
  })

  it("reports deleted plus added on same level", () => {
    expect(detectMigrationConflicts(
      state(["Справочник.Товары.Реквизит.Артикул"]),
      state(["Справочник.Товары.Реквизит.НовыйАртикул"]),
    )).toEqual([
      {
        levelPath: "Справочник.Товары.Реквизит",
        deleted: ["Артикул"],
        added: ["НовыйАртикул"],
      },
    ])
  })

  it("allows deletion and addition on different levels", () => {
    expect(detectMigrationConflicts(
      state(["Справочник.Товары.Реквизит.Артикул"]),
      state(["Справочник.Товары.ТабличнаяЧасть.Состав"]),
    )).toEqual([])
  })
})
