import { describe, expect, it } from "vitest"
import {
  fullMetadataAttribute,
  fullMetadataAttributeEnterprise,
  shortMetadataAttributeEnterprise,
  shortMetadataAttributeWithSynonym,
  singleAttributesEnterprise,
} from "~/tests/fixtures/metadataAttribute/enterprise"
import { mockСontext } from "~/tests/mockContext"
import { singleAttributes } from "../../../tests/fixtures/metadataAttribute/single"
import { exportMetadataAttributesToEnterprise, exportMetadataAttributeToEnterprise } from "./exportToEnterprise"

describe("exportMetadataAttributeToEnterprise", () => {
  it("should export metadata attribute to enterprise", () => {
    const metadataAttribute = fullMetadataAttribute

    const expectedResult = fullMetadataAttributeEnterprise

    const result = exportMetadataAttributeToEnterprise(mockСontext, metadataAttribute)

    expect(result).toEqual(expectedResult)
  })

  it("should export metadata attribute to enterprise with short format", () => {
    const metadataAttribute = shortMetadataAttributeWithSynonym

    const expectedResult = shortMetadataAttributeEnterprise

    const result = exportMetadataAttributeToEnterprise(mockСontext, metadataAttribute)

    expect(result).toEqual(expectedResult)
  })

  it("should export metadata attribute to enterprise with single format", () => {
    const expectedResult = singleAttributesEnterprise

    const result = exportMetadataAttributesToEnterprise(mockСontext, singleAttributes)

    expect(result).toEqual(expectedResult)
  })
})
