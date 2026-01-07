import { describe, expect, it } from "vitest"
import {
  fullFormAttributes,
  fullFormAttributesEnterprise,
  minimalFormAttributes,
  minimalFormAttributesEnterprise,
  shortFormAttribute,
  shortFormAttributeEnterprise,
} from "~/tests/fixtures/formAttributes/data"
import { mockСontext } from "~/tests/mockContext"
import { importFormAttributesFromEnterprise } from "./importFromEnterprise"
import { FormAttributes } from "./types"

describe("importFormAttributesFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, fullFormAttributesEnterprise)

    const resultWithIds = fillIds(result)

    expect(resultWithIds).toEqual(fullFormAttributes)
  })

  it("should import minimal", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, minimalFormAttributesEnterprise)

    const resultWithIds = fillIds(result)
    expect(resultWithIds).toEqual(minimalFormAttributes)
  })

  it("should import with short format", () => {
    const result = importFormAttributesFromEnterprise(mockСontext, shortFormAttributeEnterprise)

    const resultWithIds = fillIds(result)
    expect(resultWithIds).toEqual(shortFormAttribute)
  })
})

const fillIds = (data: FormAttributes | undefined): FormAttributes | undefined => {
  if (!data) return undefined

  return data.map((attribute) => ({ ...attribute, id: "1" }))
}
