import { describe, expect, it } from "vitest"
import {
  multipleCommandSet,
  multipleCommandSetYAML,
  singleCommandSet,
  singleCommandSetYAML,
} from "~/tests/fixtures/forms/commandSet/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importCommandSetFromYAML } from "./fromYAML"

describe("importCommandSetFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandSetFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single command set", () => {
    const result = importCommandSetFromYAML(mockContext, mockRule, singleCommandSetYAML)

    expect(result).toEqual(singleCommandSet)
  })

  it("should import multiple command sets", () => {
    const result = importCommandSetFromYAML(mockContext, mockRule, multipleCommandSetYAML)

    expect(result).toEqual(multipleCommandSet)
  })
})
