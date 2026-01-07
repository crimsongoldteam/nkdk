import { describe, expect, it } from "vitest"
import { fullPage, fullPageEnterprise, minimalPage, minimalPageEnterprise } from "~/tests/fixtures/forms/page/data"
import { mockСontext } from "~/tests/mockContext"
import { exportPageToEnterprise } from "./exportToEnterprise"

describe("exportPageToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPageToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportPageToEnterprise(mockСontext, fullPage)

    expect(result).toEqual(fullPageEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPageToEnterprise(mockСontext, minimalPage)

    expect(result).toEqual(minimalPageEnterprise)
  })
})

