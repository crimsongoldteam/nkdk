import { describe, expect, it } from "vitest"
import { fullLabelField, fullLabelFieldEnterprise, minimalLabelField, minimalLabelFieldEnterprise } from "~/tests/fixtures/forms/labelField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportLabelFieldToEnterprise } from "./exportToEnterprise"

describe("exportLabelFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportLabelFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportLabelFieldToEnterprise(mockСontext, fullLabelField)

    expect(result).toEqual(fullLabelFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportLabelFieldToEnterprise(mockСontext, minimalLabelField)

    expect(result).toEqual(minimalLabelFieldEnterprise)
  })
})

