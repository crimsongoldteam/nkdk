import { describe, expect, it } from "vitest"
import { fullDendrogramField, fullDendrogramFieldEnterprise, minimalDendrogramField, minimalDendrogramFieldEnterprise } from "~/tests/fixtures/forms/dendrogramField/data"
import { mockСontext } from "~/tests/mockContext"
import { importDendrogramFieldFromEnterprise } from "./importFromEnterprise"

describe("importDendrogramFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importDendrogramFieldFromEnterprise(mockСontext, undefined, fullDendrogramField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importDendrogramFieldFromEnterprise(mockСontext, fullDendrogramFieldEnterprise, fullDendrogramField.name)
    result!.id = "1"

    expect(result).toEqual(fullDendrogramField)
  })

  it("should import minimal", () => {
    const result = importDendrogramFieldFromEnterprise(mockСontext, minimalDendrogramFieldEnterprise, minimalDendrogramField.name)
    result!.id = "1"

    expect(result).toEqual(minimalDendrogramField)
  })
})

