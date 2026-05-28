import { describe, expect, it } from "vitest"
import { getTypeRule } from "~/metadata/orchestration"
import { importFromYAMLFunction } from "~/metadata/orchestration/property/fn"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importMetadataItemLinkFromYAML, importMetadataItemLinksFromYAML } from "./fromYAML"

describe("importMetadataItemLinkFromYAML", () => {
  it("should import metadata item link from enterprise", () => {
    const result = importMetadataItemLinkFromYAML(mockContext, mockRule, "Справочник.Организации")

    expect(result).toEqual("Catalog.Организации")
  })

  it("should keep user-defined item name that matches metadata type alias literal", () => {
    const result = importMetadataItemLinkFromYAML(mockContext, mockRule, "ОбщаяКоманда.ПланСчетов")

    expect(result).toEqual("CommonCommand.ПланСчетов")
  })

  it("should register metadata item link YAML importer", () => {
    const importFromYAML = getTypeRule("MetadataItemLink", "importFromYAML") as importFromYAMLFunction

    const result = importFromYAML(mockContext, mockRule, "ОбщаяКоманда.ПланСчетов")

    expect(result).toEqual("CommonCommand.ПланСчетов")
  })

  it("imports short role references back to full Role reference when rule asks for name form", () => {
    const rule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const

    expect(importMetadataItemLinkFromYAML(mockContext, rule, "Администратор")).toBe("Role.Администратор")
    expect(importMetadataItemLinkFromYAML(mockContext, rule, "Role.Администратор")).toBe("Role.Администратор")
  })

  it("keeps non-role references unchanged in short role mode", () => {
    const rule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const

    expect(importMetadataItemLinkFromYAML(mockContext, rule, "CommonForm.НачалоРаботы")).toBe(
      "CommonForm.НачалоРаботы"
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
      "ОбщаяКоманда.ПланСчетов",
      "Документ.Продажа",
    ])

    expect(result).toEqual(["CommonCommand.ПланСчетов", "Document.Продажа"])
  })

  it("imports short role references back to full Role reference when rule asks for name form", () => {
    const rule = { type: "MetadataItemLinks", roleReferenceYAML: "name" } as const

    expect(importMetadataItemLinksFromYAML(mockContext, rule, ["Администратор"])).toEqual(["Role.Администратор"])
  })

  it("keeps non-role references unchanged in mixed short role mode list", () => {
    const rule = { type: "MetadataItemLinks", roleReferenceYAML: "name" } as const

    expect(importMetadataItemLinksFromYAML(mockContext, rule, ["Администратор", "CommonForm.НачалоРаботы"])).toEqual([
      "Role.Администратор",
      "CommonForm.НачалоРаботы",
    ])
  })
})
