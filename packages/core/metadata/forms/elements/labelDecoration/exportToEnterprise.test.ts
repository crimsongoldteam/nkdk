import { describe, expect, it } from "vitest"
import {
  fullLabelDecoration,
  fullLabelDecorationEnterprise,
  minimalLabelDecoration,
  minimalLabelDecorationEnterprise,
} from "~/tests/fixtures/forms/labelDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { exportLabelDecorationToEnterprise } from "./exportToEnterprise"

describe("exportLabelDecorationToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportLabelDecorationToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportLabelDecorationToEnterprise(mockСontext, fullLabelDecoration)

    expect(result).toEqual(fullLabelDecorationEnterprise)
  })

  it("should export minimal", () => {
    const result = exportLabelDecorationToEnterprise(mockСontext, minimalLabelDecoration)

    expect(result).toEqual(minimalLabelDecorationEnterprise)
  })
})
