import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { exportMetadataItemLinkToEnterprise } from "./exportToEnterprise"

describe("exportMetadataItemLinkToEnterprise", () => {
  it("should export metadata item link to enterprise", () => {
    const result = exportMetadataItemLinkToEnterprise(mockСontext, "Catalog.Организации")

    expect(result).toEqual("Справочник.Организации")
  })
})
