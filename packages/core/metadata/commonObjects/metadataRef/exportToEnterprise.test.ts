import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataItemLinkToEnterprise } from "./exportToEnterprise"

describe("exportMetadataItemLinkToEnterprise", () => {
  it("should export metadata item link to enterprise", () => {
    const result = exportMetadataItemLinkToEnterprise(mockContext, mockRule, "Catalog.Организации")

    expect(result).toEqual("Справочник.Организации")
  })
})
