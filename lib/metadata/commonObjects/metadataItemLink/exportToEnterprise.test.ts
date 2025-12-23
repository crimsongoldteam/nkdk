import { describe, expect, it } from "vitest"
import { mockcontext } from "~/lib/tests/mockContext"
import { exportMetadataItemLinkToEnterprise } from "./exportToEnterprise"
import { MetadataItemLink } from "./types"

describe("exportMetadataItemLinkToEnterprise", () => {
  it("should export metadata item link to enterprise", () => {
    const metadataItemLink: MetadataItemLink = "CatalogRef.Организации"
    const expectedResult = "Справочник.Организации"

    const result = exportMetadataItemLinkToEnterprise(mockcontext, metadataItemLink)

    expect(result).toEqual(expectedResult)
  })
})
