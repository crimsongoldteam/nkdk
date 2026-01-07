import { describe, expect, it } from "vitest"
import { fullPage, fullPageEnterprise, minimalPage, minimalPageEnterprise } from "~/tests/fixtures/forms/page/data"
import { mockСontext } from "~/tests/mockContext"
import { importPageFromEnterprise } from "./importFromEnterprise"

describe("importPageFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPageFromEnterprise(mockСontext, undefined, fullPage.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importPageFromEnterprise(mockСontext, fullPageEnterprise, fullPage.name)
    result!.id = "1"

    expect(result).toEqual(fullPage)
  })

  it("should import minimal", () => {
    const result = importPageFromEnterprise(mockСontext, minimalPageEnterprise, minimalPage.name)
    result!.id = "1"

    expect(result).toEqual(minimalPage)
  })
})

