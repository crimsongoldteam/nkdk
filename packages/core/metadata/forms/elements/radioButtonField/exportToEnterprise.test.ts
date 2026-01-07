import { describe, expect, it } from "vitest"
import {
  fullRadioButtonField,
  fullRadioButtonFieldEnterprise,
  minimalRadioButtonField,
  minimalRadioButtonFieldEnterprise,
} from "~/tests/fixtures/forms/radioButtonField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportRadioButtonFieldToEnterprise } from "./exportToEnterprise"

describe("exportRadioButtonFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportRadioButtonFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportRadioButtonFieldToEnterprise(mockСontext, fullRadioButtonField)

    expect(result).toEqual(fullRadioButtonFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportRadioButtonFieldToEnterprise(mockСontext, minimalRadioButtonField)

    expect(result).toEqual(minimalRadioButtonFieldEnterprise)
  })
})

