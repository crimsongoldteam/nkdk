import { describe, expect, it } from "vitest"
import { getTypeRule } from "~/metadata/orchestration"
import { ExportToYAMLFunction } from "~/metadata/orchestration/property/fn"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataItemLinkToYAML } from "./toYAML"

describe("exportMetadataItemLinkToYAML", () => {
  it("should export metadata item link to enterprise", () => {
    const result = exportMetadataItemLinkToYAML(mockContext, mockRule, "Catalog.Организации")

    expect(result).toEqual("Справочник.Организации")
  })

  it("should register metadata item link YAML exporter", () => {
    const exportToYAML = getTypeRule("MetadataItemLink", "exportToYAML") as ExportToYAMLFunction

    const result = exportToYAML(mockContext, mockRule, "Document.Встреча")

    expect(result).toEqual("Документ.Встреча")
  })
})
