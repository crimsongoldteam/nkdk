import { describe, expect, it } from "vitest"
import { getTypeRule } from "~/metadata/orchestration"
import { ExportToYAMLFunctionNew } from "~/metadata/orchestration/property/fn"
import { mockContext, mockRule } from "~/tests/mockContext"
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

  it("exports role references without Role prefix when rule asks for name form", () => {
    const rule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const

    expect(exportMetadataItemLinkToYAML(mockContext, rule, "Role.Администратор")).toBe("Администратор")
  })

  it("keeps uuid-like visibility keys unchanged in short role mode", () => {
    const rule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const

    expect(exportMetadataItemLinkToYAML(mockContext, rule, "418deaa0-683e-4862-9348-c0086ba6909f")).toBe(
      "418deaa0-683e-4862-9348-c0086ba6909f"
    )
  })

  it("keeps non-metadata dotted references unchanged in short role mode", () => {
    const rule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const

    expect(exportMetadataItemLinkToYAML(mockContext, rule, "ЛокальныйПуть.НачалоРаботы")).toBe(
      "ЛокальныйПуть.НачалоРаботы"
    )
  })

  it("does not suppress metadata formatter errors in short role mode", () => {
    const rule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const

    expect(() => exportMetadataItemLinkToYAML(mockContext, rule, "Catalog.НачалоРаботы.Attribute.Имя")).toThrow(
      'Неизвестный сегмент "Attribute"'
    )
    expect(() => exportMetadataItemLinkToYAML(mockContext, rule, "Справочник.Контрагенты")).toThrow(
      'Неизвестный корень "Справочник"'
    )
  })
})

describe("exportMetadataItemLinksToYAML", () => {
  it("exports role references without Role prefix when rule asks for name form", () => {
    const rule = { type: "MetadataItemLinks", roleReferenceYAML: "name" } as const

    expect(exportMetadataItemLinksToYAML(mockContext, rule, ["Role.Администратор"])).toEqual(["Администратор"])
  })

  it("keeps non-metadata dotted references unchanged in mixed short role mode list", () => {
    const rule = { type: "MetadataItemLinks", roleReferenceYAML: "name" } as const

    expect(exportMetadataItemLinksToYAML(mockContext, rule, ["Role.Администратор", "ЛокальныйПуть.НачалоРаботы"])).toEqual([
      "Администратор",
      "ЛокальныйПуть.НачалоРаботы",
    ])
  })

  it("does not suppress metadata formatter errors in mixed short role mode list", () => {
    const rule = { type: "MetadataItemLinks", roleReferenceYAML: "name" } as const

    expect(() =>
      exportMetadataItemLinksToYAML(mockContext, rule, ["Role.Администратор", "Catalog.НачалоРаботы.Attribute.Имя"])
    ).toThrow('Неизвестный сегмент "Attribute"')
  })
})
