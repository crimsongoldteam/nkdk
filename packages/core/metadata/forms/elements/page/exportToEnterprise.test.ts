import { describe, expect, it } from "vitest"
import {
  fullPage,
  fullPagePartialEnterprise,
  fullPageTypedEnterprise,
  minimalPage,
  minimalPagePartialEnterprise,
} from "~/tests/fixtures/forms/page/data"
import { mockСontext } from "~/tests/mockContext"
import { exportPagePartialToEnterprise, exportPageTypedToEnterprise } from "./exportToEnterprise"

describe("exportPagePartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportPagePartialToEnterprise(mockСontext, fullPage)

    expect(result).toEqual(fullPagePartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPagePartialToEnterprise(mockСontext, minimalPage)

    expect(result).toEqual(minimalPagePartialEnterprise)
  })
})

describe("exportPageTypedToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportPageTypedToEnterprise(mockСontext, fullPage)

    expect(result).toEqual(fullPageTypedEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportPageTypedToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
