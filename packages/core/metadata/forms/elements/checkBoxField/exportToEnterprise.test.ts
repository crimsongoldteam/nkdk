import { describe, expect, it } from "vitest"
import {
  fullCheckBoxField,
  fullCheckBoxFieldEnterprise,
  minimalCheckBoxField,
  minimalCheckBoxFieldEnterprise,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportCheckBoxFieldToEnterprise } from "./exportToEnterprise"

describe("exportCheckBoxFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCheckBoxFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportCheckBoxFieldToEnterprise(mockСontext, fullCheckBoxField)

    expect(result).toEqual(fullCheckBoxFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportCheckBoxFieldToEnterprise(mockСontext, minimalCheckBoxField)

    expect(result).toEqual(minimalCheckBoxFieldEnterprise)
  })
})
