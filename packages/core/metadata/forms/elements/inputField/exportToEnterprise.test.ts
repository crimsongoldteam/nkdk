import { describe, expect, it } from "vitest"
import { fullInputField, fullInputFieldEnterprise } from "~/tests/fixtures/forms/inputField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportInputFieldToEnterprise } from "./exportToEnterprise"

describe("exportInputFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportInputFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportInputFieldToEnterprise(mockСontext, fullInputField)

    expect(result).toEqual(fullInputFieldEnterprise)
  })
})
