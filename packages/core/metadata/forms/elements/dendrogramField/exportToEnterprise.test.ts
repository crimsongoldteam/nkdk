import { describe, expect, it } from "vitest"
import { fullDendrogramField, fullDendrogramFieldEnterprise, minimalDendrogramField, minimalDendrogramFieldEnterprise } from "~/tests/fixtures/forms/dendrogramField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportDendrogramFieldToEnterprise } from "./exportToEnterprise"

describe("exportDendrogramFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportDendrogramFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportDendrogramFieldToEnterprise(mockСontext, fullDendrogramField)

    expect(result).toEqual(fullDendrogramFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportDendrogramFieldToEnterprise(mockСontext, minimalDendrogramField)

    expect(result).toEqual(minimalDendrogramFieldEnterprise)
  })
})

