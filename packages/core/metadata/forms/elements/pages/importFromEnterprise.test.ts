import { describe, expect, it } from "vitest"
import { fullPages, fullPagesEnterprise, minimalPages, minimalPagesEnterprise } from "~/tests/fixtures/forms/pages/data"
import { mockСontext } from "~/tests/mockContext"
import { importPagesFromEnterprise } from "./importFromEnterprise"

describe("importPagesFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPagesFromEnterprise(mockСontext, undefined, fullPages.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importPagesFromEnterprise(mockСontext, fullPagesEnterprise, fullPages.name)
    result!.id = "1"

    expect(result).toEqual(fullPages)
  })

  it("should import minimal", () => {
    const result = importPagesFromEnterprise(mockСontext, minimalPagesEnterprise, minimalPages.name)
    result!.id = "1"

    expect(result).toEqual(minimalPages)
  })
})

