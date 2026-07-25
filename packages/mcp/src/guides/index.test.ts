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
    expect(editGuide?.text).toContain("nkdk.find_references")
    expect(editGuide?.text).not.toContain("nkdk.delete_item")
    expect(editGuide?.text).toContain("metadataRef")
    expect(editGuide?.text).toContain("componentPath")
    expect(editGuide?.text).toContain("Справочник.Товары.Реквизит.Артикул")
    expect(editGuide?.text).toContain("Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество")
  })

  it("describes core-owned XML-import component selection and conflicts", () => {
    const importGuide = guideDefinitions.find((guide) => guide.uri === "nkdk://guides/config-import-from-xml")

    expect(importGuide?.text).toContain("одного компонента")
    expect(importGuide?.text).toContain("корень NKDK-проекта с каталогом cf")
    expect(importGuide?.text).toContain("Не определяй и не создавай cfe")
    expect(importGuide?.text).toContain("core определит componentPath")
    expect(importGuide?.text).toContain("конфликты целевого каталога и снимка")
    expect(importGuide?.text).toContain("Не очищай существующую цель автоматически")
    expect(importGuide?.text).toContain("явного устранения пользователем конкретного конфликта")
    expect(importGuide?.text).toContain("Конфликт только снимка не устраняется очисткой целевого компонента")
    expect(importGuide?.text).not.toContain("projectDir/componentPath")
    expect(importGuide?.text).not.toContain("должен отсутствовать или быть пустым")
    expect(importGuide?.text).not.toContain("перед повтором его нужно очистить")
    expect(importGuide?.text).toContain("пишет результат напрямую")
    expect(importGuide?.text).not.toContain(".nkdk/tmp/import/<operation-id>")
    expect(importGuide?.text).toContain("не подключается к 1С")
    expect(importGuide?.text).toContain("не импортирует все компоненты")
  })

  it("describes sync through configuration index without reference catalog", () => {
    const syncGuide = guideDefinitions.find((guide) => guide.uri === "nkdk://guides/config-sync-to-xml")

    expect(syncGuide?.text).toContain("файла индекса конфигурации")
    expect(syncGuide?.text).toContain("projectDir/componentPath")
    expect(syncGuide?.text).toContain("xmlRootDir/componentPath")
    expect(syncGuide?.text).not.toContain("reference")
  })
})
