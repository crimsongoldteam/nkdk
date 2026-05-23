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
})

describe("importMetadataItemLinksFromYAML", () => {
  it("should keep user-defined item names that match metadata type aliases literal", () => {
    const result = importMetadataItemLinksFromYAML(mockContext, mockRule, [
      "ОбщаяКоманда.ПланСчетов",
      "Документ.Продажа",
    ])

    expect(result).toEqual(["CommonCommand.ПланСчетов", "Document.Продажа"])
  })
})
