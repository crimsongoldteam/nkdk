import { describe, expect, it } from "vitest"
import { promptDefinitions } from "./index"

describe("prompt definitions", () => {
  const removedOperationTargetsTool = ["nkdk", "list_operation_" + "targets"].join(".")

  it("contains the four first-version prompts", () => {
    expect(promptDefinitions.map((prompt) => prompt.name)).toEqual([
      "nkdk_config_edit_yaml",
      "nkdk_config_import_from_xml",
      "nkdk_config_sync_to_xml",
      "nkdk_config_validate_yaml",
    ])
  })

  it("tells agents to use operation tools before manual YAML edits", () => {
    const editPrompt = promptDefinitions.find((prompt) => prompt.name === "nkdk_config_edit_yaml")

    expect(editPrompt?.text).not.toContain(removedOperationTargetsTool)
    expect(editPrompt?.text).toContain("nkdk.rename_item")
    expect(editPrompt?.text).toContain("nkdk.delete_item")
    expect(editPrompt?.text).toContain("Справочник.Товары.Реквизит.Артикул")
    expect(editPrompt?.text).toContain("Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество")
  })
})
