import { describe, expect, it } from "vitest"
import { fullFieldsList, fullFieldsListEnterprise } from "~/tests/fixtures/fieldsList/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importFieldsListFromYAML } from "./importFromYAML"

describe("importFieldsListFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFieldsListFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importFieldsListFromYAML(mockContext, mockRule, fullFieldsListEnterprise)

    expect(result).toEqual(fullFieldsList)
  })
})
