import { describe, expect, it } from "vitest"
import { buildRenameTargetPathFromOperationPath, parseMetadataOperationPath } from "./operationPath"

describe("parseMetadataOperationPath", () => {
  it("parses object and nested target paths", () => {
    expect(parseMetadataOperationPath("Справочник.Товары")).toEqual({
      ok: true,
      path: "Справочник.Товары",
      owner: { itemTypePrefix: "Справочник", name: "Товары" },
      chain: [],
      localName: "Товары",
    })
    expect(parseMetadataOperationPath("Справочник.Товары.Реквизит.Артикул")).toMatchObject({
      ok: true,
      owner: { itemTypePrefix: "Справочник", name: "Товары" },
      chain: [{ collectionSegment: "Реквизит", name: "Артикул" }],
      localName: "Артикул",
    })
    expect(parseMetadataOperationPath("Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество")).toMatchObject({
      ok: true,
      owner: { itemTypePrefix: "Документ", name: "Заказ" },
      chain: [
        { collectionSegment: "ТабличнаяЧасть", name: "Товары" },
        { collectionSegment: "Реквизит", name: "Количество" },
      ],
      localName: "Количество",
    })
  })

  it("rejects syntactically invalid paths", () => {
    for (const value of ["", "Справочник.Товары.", "Справочник..Товары", "Справочник.Товары.Реквизит"]) {
      expect(parseMetadataOperationPath(value)).toMatchObject({ ok: false, code: "invalid_path" })
    }
  })

  it("replaces only the last local name for migration target path", () => {
    expect(buildRenameTargetPathFromOperationPath("Справочник.Товары.Реквизит.Артикул", "КодПоставщика")).toBe(
      "Справочник.Товары.Реквизит.КодПоставщика"
    )
    expect(
      buildRenameTargetPathFromOperationPath("Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество", "Цена")
    ).toBe("Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Цена")
  })
})
