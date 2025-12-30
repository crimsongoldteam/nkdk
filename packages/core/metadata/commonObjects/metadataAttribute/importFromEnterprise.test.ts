import { describe, expect, it } from "vitest"
import {
  full,
  fullEnterprise,
  minimal,
  minimalEnterprise,
  short,
  shortEnterprise,
} from "~/tests/fixtures/metadataAttribute/data"
import { mockСontext } from "~/tests/mockContext"
import { exportMetadataAttributesToEnterprise } from "./exportToEnterprise"
import { importMetadataAttributesFromEnterprise } from "./importFromEnterprise"

describe("importMetadataAttributeFromEnterprise", () => {
  it("shouldreturn undefined when data is undefined", () => {
    const result = importMetadataAttributesFromEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importMetadataAttributesFromEnterprise(mockСontext, fullEnterprise)

    expect(result).toEqual(full)
  })

  it("should import minimal", () => {
    const result = importMetadataAttributesFromEnterprise(mockСontext, minimalEnterprise)

    expect(result).toEqual(minimal)
  })

  it("should import with short format", () => {
    const result = exportMetadataAttributesToEnterprise(mockСontext, short)

    expect(result).toEqual(shortEnterprise)
  })
})
