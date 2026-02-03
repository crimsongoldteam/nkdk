import { describe, expect, it } from "vitest"
import {
  multipleCommandSet,
  multipleCommandSetEnterprise,
  singleCommandSet,
  singleCommandSetEnterprise,
} from "~/tests/fixtures/forms/commandSet/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importCommandSetFromEnterprise } from "./importFromEnterprise"

describe("importCommandSetFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandSetFromEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single command set", () => {
    const result = importCommandSetFromEnterprise(mockContext, mockRule, singleCommandSetEnterprise)

    expect(result).toEqual(singleCommandSet)
  })

  it("should import multiple command sets", () => {
    const result = importCommandSetFromEnterprise(mockContext, mockRule, multipleCommandSetEnterprise)

    expect(result).toEqual(multipleCommandSet)
  })
})
