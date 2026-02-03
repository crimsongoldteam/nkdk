import { describe, expect, it } from "vitest"
import { fullFieldsList, fullFieldsListEnterprise } from "~/tests/fixtures/fieldsList/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importFieldsListFromEnterprise } from "./importFromEnterprise"

describe("importFieldsListFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFieldsListFromEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importFieldsListFromEnterprise(mockContext, mockRule, fullFieldsListEnterprise)

    expect(result).toEqual(fullFieldsList)
  })
})
