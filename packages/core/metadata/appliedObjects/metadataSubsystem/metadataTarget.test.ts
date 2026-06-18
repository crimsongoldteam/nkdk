import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML, importMetadataItemFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { MetadataSubsystemRules } from "./rules"

describe("MetadataSubsystem metadataTarget", () => {
  it("imports exact object links in content", () => {
    expect(
      importMetadataItemFromYAML({
        context: mockContext,
        rule: MetadataSubsystemRules,
        name: "СтандартныеПодсистемы",
        yaml: {
          Состав: ["ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Таблица.ТаблицаВсеСвойства"],
        },
      })
    ).toMatchObject({
      content: ["ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Table.ТаблицаВсеСвойства"],
    })
  })

  it("exports exact object links in content", () => {
    expect(
      exportMetadataItemToYAML({
        context: mockContext,
        rule: MetadataSubsystemRules,
        data: {
          itemType: "MetadataSubsystem",
          name: "СтандартныеПодсистемы",
          content: ["ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства"],
        },
      })
    ).toMatchObject({
      Состав: ["ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства"],
    })
  })

  it("rejects member links in content", () => {
    expect(() =>
      importMetadataItemFromYAML({
        context: mockContext,
        rule: MetadataSubsystemRules,
        name: "СтандартныеПодсистемы",
        yaml: {
          Состав: ["Документ.АвансовыйОтчет.Реквизит.Организация"],
        },
      })
    ).toThrow('Неизвестный сегмент "Реквизит"')
  })
})
