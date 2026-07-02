import { describe, expect, it } from "vitest"
import { getTypeRule } from "../../orchestration"
import { ExportToYAMLFunctionNew } from "../../orchestration/property/fn"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportMetadataItemLinkToYAML, exportMetadataItemLinksToYAML } from "./toYAML"

describe("exportMetadataItemLinkToYAML", () => {
  it("should export metadata item link to enterprise", () => {
    const result = exportMetadataItemLinkToYAML(mockContext, mockRule, "Catalog.Организации")

    expect(result).toEqual("Справочник.Организации")
  })

  it("should keep user-defined item name that matches metadata type alias literal", () => {
    const result = exportMetadataItemLinkToYAML(mockContext, mockRule, "Catalog.ПланСчетов")

    expect(result).toEqual("Справочник.ПланСчетов")
  })

  it("should register metadata item link YAML exporter", () => {
    const exportToYAML = getTypeRule("MetadataItemLink", "exportToYAML") as ExportToYAMLFunctionNew

    const result = exportToYAML({ context: mockContext, rule: mockRule, value: "Document.Встреча" })

    expect(result).toEqual("Документ.Встреча")
  })

  it("exports role references through single-root metadataTarget", () => {
    const rule = { type: "MetadataItemLink", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(exportMetadataItemLinkToYAML(mockContext, rule, "Role.Администратор")).toBe("Администратор")
  })

  it("rejects opaque values in role metadataTarget mode", () => {
    const rule = { type: "MetadataItemLink", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(() => exportMetadataItemLinkToYAML(mockContext, rule, "418deaa0-683e-4862-9348-c0086ba6909f")).toThrow(
      'Неизвестный корень "418deaa0-683e-4862-9348-c0086ba6909f"'
    )
    expect(() => exportMetadataItemLinkToYAML(mockContext, rule, "ЛокальныйПуть.НачалоРаботы")).toThrow(
      'Неизвестный корень "ЛокальныйПуть"'
    )
  })

  it("does not suppress metadata formatter errors in role metadataTarget mode", () => {
    const rule = { type: "MetadataItemLink", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(() => exportMetadataItemLinkToYAML(mockContext, rule, "Catalog.НачалоРаботы.Attribute.Имя")).toThrow(
      'Корень "Catalog" не разрешён для цели метаданных'
    )
    expect(() => exportMetadataItemLinkToYAML(mockContext, rule, "Справочник.Контрагенты")).toThrow(
      'Неизвестный корень "Справочник"'
    )
  })
})

describe("exportMetadataItemLinksToYAML", () => {
  it("exports all top-level metadata roots used in subsystem content", () => {
    expect(
      exportMetadataItemLinksToYAML(mockContext, { type: "MetadataItemLinks" }, [
        "EventSubscription.ОтветственныеЛицаДокументаОбработкаЗаполнения",
        "XDTOPackage.egais_ActCancelOnlineOrder",
        "FunctionalOptionsParameter.ИспользоватьНоменклатуруПоставщика",
        "WSReference.Калькулятор",
        "Sequence.ПартииТоваров",
      ])
    ).toEqual([
      "ПодпискаНаСобытие.ОтветственныеЛицаДокументаОбработкаЗаполнения",
      "ПакетXDTO.egais_ActCancelOnlineOrder",
      "ПараметрФункциональныхОпций.ИспользоватьНоменклатуруПоставщика",
      "WSСсылка.Калькулятор",
      "Последовательность.ПартииТоваров",
    ])
  })

  it("exports role reference lists through single-root metadataTarget", () => {
    const rule = { type: "MetadataItemLinks", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(exportMetadataItemLinksToYAML(mockContext, rule, ["Role.Администратор"])).toEqual(["Администратор"])
  })

  it("rejects opaque values in role metadataTarget lists", () => {
    const rule = { type: "MetadataItemLinks", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(() =>
      exportMetadataItemLinksToYAML(mockContext, rule, ["Role.Администратор", "ЛокальныйПуть.НачалоРаботы"])
    ).toThrow('Неизвестный корень "ЛокальныйПуть"')
  })

  it("does not suppress metadata formatter errors in role metadataTarget lists", () => {
    const rule = { type: "MetadataItemLinks", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(() =>
      exportMetadataItemLinksToYAML(mockContext, rule, ["Role.Администратор", "Catalog.НачалоРаботы.Attribute.Имя"])
    ).toThrow('Корень "Catalog" не разрешён для цели метаданных')
  })
})
