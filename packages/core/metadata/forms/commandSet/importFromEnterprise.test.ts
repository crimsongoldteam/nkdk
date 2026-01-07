import { describe, expect, it } from "vitest"
import {
  multipleCommandSet,
  multipleCommandSetEnterprise,
  singleCommandSet,
  singleCommandSetEnterprise,
} from "~/tests/fixtures/forms/commandSet/data"
import { mockСontext } from "~/tests/mockContext"
import { importCommandSetFromEnterprise } from "./importFromEnterprise"

describe("importCommandSetFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandSetFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single command set", () => {
    const result = importCommandSetFromEnterprise(mockСontext, singleCommandSetEnterprise)

    expect(result).toEqual(singleCommandSet)
  })

  it("should import multiple command sets", () => {
    const result = importCommandSetFromEnterprise(mockСontext, multipleCommandSetEnterprise)

    expect(result).toEqual(multipleCommandSet)
  })
})
