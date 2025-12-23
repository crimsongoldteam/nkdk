import { describe, expect, it } from "vitest"
import {
  fullMetadataAttribute,
  fullMetadataAttributeEnterprise,
  shortMetadataAttribute,
  shortMetadataAttributeEnterprise,
} from "~/lib/tests/fixtures/metadataAttribute/enterprise"
import { mockcontext } from "~/lib/tests/mockContext"
import { importMetadataAttributeFromEnterprise } from "./importFromEnterprise"

describe("importMetadataAttributeFromEnterprise", () => {
  it("should import metadata attribute from enterprise", () => {
    const enterpriseData = fullMetadataAttributeEnterprise

    const expectedResult = fullMetadataAttribute

    const result = importMetadataAttributeFromEnterprise(mockcontext, enterpriseData, "ТестовыйРеквизит")

    expect(result).toEqual(expectedResult)
  })

  it("should import metadata attribute from enterprise with short format", () => {
    const enterpriseData = shortMetadataAttributeEnterprise

    const expectedResult = shortMetadataAttribute

    const result = importMetadataAttributeFromEnterprise(mockcontext, enterpriseData, "ТестовыйРеквизит")

    expect(result).toEqual(expectedResult)
  })
})
