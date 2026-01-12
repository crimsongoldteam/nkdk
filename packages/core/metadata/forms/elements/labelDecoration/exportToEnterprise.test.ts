import { describe, expect, it } from "vitest"
import {
  fullLabelDecoration,
  fullLabelDecorationPartialEnterprise,
  fullLabelDecorationTypedEnterprise,
  minimalLabelDecoration,
  minimalLabelDecorationPartialEnterprise,
} from "~/tests/fixtures/forms/labelDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { exportLabelDecorationPartialToEnterprise, exportLabelDecorationTypedToEnterprise } from "./exportToEnterprise"

describe("exportLabelDecorationPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportLabelDecorationPartialToEnterprise(mockСontext, fullLabelDecoration)

    expect(result).toEqual(fullLabelDecorationPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportLabelDecorationPartialToEnterprise(mockСontext, minimalLabelDecoration)

    expect(result).toEqual(minimalLabelDecorationPartialEnterprise)
  })
})

describe("exportLabelDecorationTypedToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportLabelDecorationTypedToEnterprise(mockСontext, fullLabelDecoration)

    expect(result).toEqual(fullLabelDecorationTypedEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportLabelDecorationTypedToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
