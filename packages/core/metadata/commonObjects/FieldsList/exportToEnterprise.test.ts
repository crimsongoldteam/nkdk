import { describe, expect, it } from "vitest"
import { fullFieldsList, fullFieldsListEnterprise } from "~/tests/fixtures/fieldsList/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportFieldsListToEnterprise } from "./exportToEnterprise"

describe("exportFieldsListToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFieldsListToEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportFieldsListToEnterprise(mockContext, mockRule, fullFieldsList)

    expect(result).toEqual(fullFieldsListEnterprise)
  })
})
