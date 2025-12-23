import { describe, expect, it } from "vitest"
import {
  fullMetadataAttribute,
  fullMetadataAttributeEnterprise,
  shortMetadataAttributeEnterprise,
  shortMetadataAttributeWithSynonym,
} from "~/lib/tests/fixtures/metadataAttribute/enterprise"
import { mockcontext } from "~/lib/tests/mockContext"
import { exportMetadataAttributeToEnterprise } from "./exportToEnterprise"

describe("exportMetadataAttributeToEnterprise", () => {
  it("should export metadata attribute to enterprise", () => {
    const metadataAttribute = fullMetadataAttribute

    const expectedResult = fullMetadataAttributeEnterprise

    const result = exportMetadataAttributeToEnterprise(mockcontext, metadataAttribute)

    expect(result).toEqual(expectedResult)
  })

  it("should export metadata attribute to enterprise with short format", () => {
    const metadataAttribute = shortMetadataAttributeWithSynonym

    const expectedResult = shortMetadataAttributeEnterprise

    const result = exportMetadataAttributeToEnterprise(mockcontext, metadataAttribute)

    expect(result).toEqual(expectedResult)
  })
})
