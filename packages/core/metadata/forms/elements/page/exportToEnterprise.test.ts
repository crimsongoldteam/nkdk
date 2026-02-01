import { describe, expect, it } from "vitest"
import {
  fullPage,
  fullPagePartialEnterprise,
  fullPageTypedEnterprise,
  minimalPage,
  minimalPagePartialEnterprise,
} from "~/tests/fixtures/forms/page/data"
import { mockContext } from "~/tests/mockContext"
import { exportPagePartialToEnterprise, exportPageTypedToEnterprise } from "./exportToEnterprise"

describe("exportPagePartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportPagePartialToEnterprise(mockContext, fullPage)

    expect(result).toEqual(fullPagePartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPagePartialToEnterprise(mockContext, minimalPage)

    expect(result).toEqual(minimalPagePartialEnterprise)
  })
})

describe("exportPageTypedToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportPageTypedToEnterprise(mockContext, fullPage)

    expect(result).toEqual(fullPageTypedEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportPageTypedToEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })
})
