import { describe, expect, it } from "vitest"
import { importPropertyFromYAML } from "~/metadata/orchestration"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importMetadataItemLinkFromYAML, importMetadataItemLinksFromYAML } from "./fromYAML"

describe("importMetadataItemLinkFromYAML", () => {
  it("should import metadata item link from enterprise", () => {
    const result = importMetadataItemLinkFromYAML(mockContext, mockRule, "Справочник.Организации")

    expect(result).toEqual("Catalog.Организации")
  })

  it("should keep user-defined item name that matches metadata type alias literal", () => {
    const result = importMetadataItemLinkFromYAML(mockContext, mockRule, "Справочник.ПланСчетов")

    expect(result).toEqual("Catalog.ПланСчетов")
  })

  it("should register metadata item link YAML importer", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: { ...mockRule, type: "MetadataItemLink" },
      value: "Справочник.ПланСчетов",
    })

    expect(result).toEqual("Catalog.ПланСчетов")
  })

  it("rejects english roots in registered metadata item link importer", () => {
    expect(() =>
      importPropertyFromYAML({
        context: mockContext,
        rule: { ...mockRule, type: "MetadataItemLink" },
        value: "Catalog.Контрагенты",
      })
    ).toThrow('Неизвестный корень "Catalog"')
  })

  it("imports russian roots in registered metadata item link importer", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: { ...mockRule, type: "MetadataItemLink" },
      value: "Справочник.Контрагенты",
    })

    expect(result).toEqual("Catalog.Контрагенты")
  })

  it("imports short role references back to full Role reference when rule asks for name form", () => {
    const rule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const

    expect(importMetadataItemLinkFromYAML(mockContext, rule, "Администратор")).toBe("Role.Администратор")
    expect(importMetadataItemLinkFromYAML(mockContext, rule, "Role.Администратор")).toBe("Role.Администратор")
  })

  it("keeps non-metadata dotted references unchanged in short role mode", () => {
    const rule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const

    expect(importMetadataItemLinkFromYAML(mockContext, rule, "ЛокальныйПуть.НачалоРаботы")).toBe(
      "ЛокальныйПуть.НачалоРаботы"
    )
  })

  it("does not suppress metadata parser errors in short role mode", () => {
    const rule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const

    expect(() => importMetadataItemLinkFromYAML(mockContext, rule, "Catalog.Контрагенты")).toThrow(
      'Неизвестный корень "Catalog"'
    )
    expect(() => importMetadataItemLinkFromYAML(mockContext, rule, "CommonForm.НачалоРаботы")).toThrow(
      'Неизвестный корень "CommonForm"'
    )
  })

  it("keeps uuid-like visibility keys unchanged in short role mode", () => {
    const rule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const

    expect(importMetadataItemLinkFromYAML(mockContext, rule, "418deaa0-683e-4862-9348-c0086ba6909f")).toBe(
      "418deaa0-683e-4862-9348-c0086ba6909f"
    )
  })
})

describe("importMetadataItemLinksFromYAML", () => {
  it("should keep user-defined item names that match metadata type aliases literal", () => {
    const result = importMetadataItemLinksFromYAML(mockContext, mockRule, [
      "Справочник.ПланСчетов",
      "Документ.Продажа",
    ])

    expect(result).toEqual(["Catalog.ПланСчетов", "Document.Продажа"])
  })

  it("rejects english roots in registered metadata item links importer", () => {
    expect(() =>
      importPropertyFromYAML({
        context: mockContext,
        rule: { ...mockRule, type: "MetadataItemLinks" },
        value: ["Catalog.Контрагенты"],
      })
    ).toThrow('Неизвестный корень "Catalog"')
  })

  it("imports short role references back to full Role reference when rule asks for name form", () => {
    const rule = { type: "MetadataItemLinks", roleReferenceYAML: "name" } as const

    expect(importMetadataItemLinksFromYAML(mockContext, rule, ["Администратор"])).toEqual(["Role.Администратор"])
  })

  it("keeps non-metadata dotted references unchanged in mixed short role mode list", () => {
    const rule = { type: "MetadataItemLinks", roleReferenceYAML: "name" } as const

    expect(importMetadataItemLinksFromYAML(mockContext, rule, ["Администратор", "ЛокальныйПуть.НачалоРаботы"])).toEqual([
      "Role.Администратор",
      "ЛокальныйПуть.НачалоРаботы",
    ])
  })

  it("does not suppress metadata parser errors in mixed short role mode list", () => {
    const rule = { type: "MetadataItemLinks", roleReferenceYAML: "name" } as const

    expect(() => importMetadataItemLinksFromYAML(mockContext, rule, ["Администратор", "CommonForm.НачалоРаботы"])).toThrow(
      'Неизвестный корень "CommonForm"'
    )
  })
})
