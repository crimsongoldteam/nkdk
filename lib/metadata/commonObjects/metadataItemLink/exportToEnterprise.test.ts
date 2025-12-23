import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { exportMetadataItemLinkToEnterprise } from "./exportToEnterprise"
import { MetadataItemLink } from "./types"

describe("exportMetadataItemLinkToEnterprise", () => {
  it("should export metadata item link to enterprise", () => {
    const metadataItemLink: MetadataItemLink = "CatalogRef.Организации"
    const expectedResult = "Справочник.Организации"

    const result = exportMetadataItemLinkToEnterprise(mockConfigurationSettings, metadataItemLink)

    expect(result).toEqual(expectedResult)
  })
})
