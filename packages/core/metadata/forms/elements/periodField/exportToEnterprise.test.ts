import { describe, expect, it } from "vitest"
import {
  fullPeriodField,
  fullPeriodFieldEnterprise,
  minimalPeriodField,
  minimalPeriodFieldEnterprise,
} from "~/tests/fixtures/forms/periodField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportPeriodFieldToEnterprise } from "./exportToEnterprise"

describe("exportPeriodFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPeriodFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportPeriodFieldToEnterprise(mockСontext, fullPeriodField)

    expect(result).toEqual(fullPeriodFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPeriodFieldToEnterprise(mockСontext, minimalPeriodField)

    expect(result).toEqual(minimalPeriodFieldEnterprise)
  })
})
