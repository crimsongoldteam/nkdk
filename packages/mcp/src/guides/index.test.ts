import { describe, expect, it } from "vitest"
import { guideDefinitions } from "./index"

describe("guide definitions", () => {
  const removedOperationTargetsTool = ["nkdk", "list_operation_" + "targets"].join(".")

  it("contains the four first-version guides", () => {
    expect(guideDefinitions.map((guide) => guide.uri)).toEqual([
      "nkdk://guides/config-edit-yaml",
      "nkdk://guides/config-import-from-xml",
      "nkdk://guides/config-sync-to-xml",
      "nkdk://guides/config-validate-yaml",
    ])
  })

  it("tells agents to use operation tools for rename and delete", () => {
    const editGuide = guideDefinitions.find((guide) => guide.uri === "nkdk://guides/config-edit-yaml")

    expect(editGuide?.text).not.toContain(removedOperationTargetsTool)
    expect(editGuide?.text).toContain("nkdk.rename_item")
    expect(editGuide?.text).toContain("nkdk.delete_item")
    expect(editGuide?.text).toContain("Справочник.Товары.Реквизит.Артикул")
    expect(editGuide?.text).toContain("Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество")
  })
})
