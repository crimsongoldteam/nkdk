import { describe, expect, it } from "vitest"
import {
  fullCommandBar,
  fullCommandBarPartialEnterprise,
  fullCommandBarTypedEnterprise,
  minimalCommandBar,
  minimalCommandBarPartialEnterprise,
} from "~/tests/fixtures/forms/commandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { exportCommandBarPartialToEnterprise, exportCommandBarTypedToEnterprise } from "./exportToEnterprise"

describe("exportCommandBarPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportCommandBarPartialToEnterprise(mockСontext, fullCommandBar)

    expect(result).toEqual(fullCommandBarPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportCommandBarPartialToEnterprise(mockСontext, minimalCommandBar)

    expect(result).toEqual(minimalCommandBarPartialEnterprise)
  })
})

describe("exportCommandBarTypedToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportCommandBarTypedToEnterprise(mockСontext, fullCommandBar)

    expect(result).toEqual(fullCommandBarTypedEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportCommandBarTypedToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})

