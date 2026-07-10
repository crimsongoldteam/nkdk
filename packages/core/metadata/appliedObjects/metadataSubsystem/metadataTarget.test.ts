import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML, importMetadataItemFromYAML } from "../../orchestration"
import { mockContext } from "../../../tests/mockContext"
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

  it("exports nested subsystem links in content", () => {
    expect(
      exportMetadataItemToYAML({
        context: mockContext,
        rule: MetadataSubsystemRules,
        data: {
          itemType: "MetadataSubsystem",
          name: "СтандартныеПодсистемы",
          content: ["Subsystem.СтандартныеПодсистемы.Subsystem.АдресныйКлассификатор"],
        },
      })
    ).toMatchObject({
      Состав: ["Подсистема.СтандартныеПодсистемы.Подсистема.АдресныйКлассификатор"],
    })
  })

  it("exports functional options parameter links from XML model content", () => {
    expect(
      exportMetadataItemToYAML({
        context: mockContext,
        rule: MetadataSubsystemRules,
        data: {
          itemType: "MetadataSubsystem",
          name: "СтандартныеПодсистемы",
          content: ["FunctionalOptionsParameter.ПараметрФункциональныхОпцийВсеСвойства"],
        },
      })
    ).toMatchObject({
      Состав: ["ПараметрФункциональныхОпций.ПараметрФункциональныхОпцийВсеСвойства"],
    })
  })

  it("imports functional options parameter links to XML model content", () => {
    expect(
      importMetadataItemFromYAML({
        context: mockContext,
        rule: MetadataSubsystemRules,
        name: "СтандартныеПодсистемы",
        yaml: {
          Состав: ["ПараметрФункциональныхОпций.ПараметрФункциональныхОпцийВсеСвойства"],
        },
      })
    ).toMatchObject({
      content: ["FunctionalOptionsParameter.ПараметрФункциональныхОпцийВсеСвойства"],
    })
  })

  it("imports and exports sequence links in content", () => {
    expect(
      exportMetadataItemToYAML({
        context: mockContext,
        rule: MetadataSubsystemRules,
        data: {
          itemType: "MetadataSubsystem",
          name: "СтруктураГруппы",
          content: ["Sequence.ДокументыДвиженияИнвестиций"],
        },
      })
    ).toMatchObject({
      Состав: ["Последовательность.ДокументыДвиженияИнвестиций"],
    })

    expect(
      importMetadataItemFromYAML({
        context: mockContext,
        rule: MetadataSubsystemRules,
        name: "СтруктураГруппы",
        yaml: {
          Состав: ["Последовательность.ДокументыДвиженияИнвестиций"],
        },
      })
    ).toMatchObject({
      content: ["Sequence.ДокументыДвиженияИнвестиций"],
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
