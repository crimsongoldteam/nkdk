import { describe, expect, it } from "vitest"
import {
  fullMetadataAttribute,
  fullMetadataAttributeEnterprise,
  shortMetadataAttribute,
  shortMetadataAttributeEnterprise,
  singleAttributesEnterprise,
} from "~/tests/fixtures/metadataAttribute/enterprise"
import { mockСontext } from "~/tests/mockContext"
import { importMetadataAttributeFromEnterprise, importMetadataAttributesFromEnterprise } from "./importFromEnterprise"
import { singleAttributes } from "~/tests/fixtures/metadataAttribute/single"

describe("importMetadataAttributeFromEnterprise", () => {
  it("should import metadata attribute from enterprise", () => {
    const enterpriseData = fullMetadataAttributeEnterprise

    const expectedResult = fullMetadataAttribute

    const result = importMetadataAttributeFromEnterprise(mockСontext, enterpriseData, "ТестовыйРеквизит")

    expect(result).toEqual(expectedResult)
  })

  it("should import metadata attribute from enterprise with short format", () => {
    const enterpriseData = shortMetadataAttributeEnterprise

    const expectedResult = shortMetadataAttribute

    const result = importMetadataAttributeFromEnterprise(mockСontext, enterpriseData, "ТестовыйРеквизит")

    expect(result).toEqual(expectedResult)
  })

  it("should import metadata attribute from enterprise with single format", () => {
    const enterpriseData = singleAttributesEnterprise

    const expectedResult = singleAttributes

    const result = importMetadataAttributesFromEnterprise(mockСontext, enterpriseData)

    expect(result).toEqual(expectedResult)
  })
})
