import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataItemLinkToYAML } from "./toYAML"

describe("exportMetadataItemLinkToYAML", () => {
  it("should export metadata item link to enterprise", () => {
    const result = exportMetadataItemLinkToYAML(mockContext, mockRule, "Catalog.Организации")

    expect(result).toEqual("Справочник.Организации")
  })
})
