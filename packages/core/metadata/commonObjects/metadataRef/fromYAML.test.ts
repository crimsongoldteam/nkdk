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

  it("imports short role references through single-root metadataTarget", () => {
    const rule = { type: "MetadataItemLink", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(importMetadataItemLinkFromYAML(mockContext, rule, "Администратор")).toBe("Role.Администратор")
  })

  it("rejects prefixed and opaque role references through single-root metadataTarget", () => {
    const rule = { type: "MetadataItemLink", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(() => importMetadataItemLinkFromYAML(mockContext, rule, "Role.Администратор")).toThrow(
      'Неизвестный корень "Role"'
    )
    expect(() => importMetadataItemLinkFromYAML(mockContext, rule, "Роль.Администратор")).toThrow(
      "Ожидалось имя объекта без корня, потому что корень задан правилом"
    )
    expect(() => importMetadataItemLinkFromYAML(mockContext, rule, "418deaa0-683e-4862-9348-c0086ba6909f")).toThrow(
      'Неизвестный корень "418deaa0-683e-4862-9348-c0086ba6909f"'
    )
    expect(() => importMetadataItemLinkFromYAML(mockContext, rule, "ЛокальныйПуть.НачалоРаботы")).toThrow(
      'Неизвестный корень "ЛокальныйПуть"'
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

  it("imports short role reference lists through single-root metadataTarget", () => {
    const rule = { type: "MetadataItemLinks", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(importMetadataItemLinksFromYAML(mockContext, rule, ["Администратор"])).toEqual(["Role.Администратор"])
  })

  it("rejects opaque role list entries through single-root metadataTarget", () => {
    const rule = { type: "MetadataItemLinks", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(() =>
      importMetadataItemLinksFromYAML(mockContext, rule, ["Администратор", "ЛокальныйПуть.НачалоРаботы"])
    ).toThrow(
      'Неизвестный корень "ЛокальныйПуть"'
    )
  })
})
