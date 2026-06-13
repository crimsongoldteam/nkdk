import { describe, expect, it } from "vitest"
import {
  multipleCommandSet,
  multipleCommandSetYAML,
  singleCommandSet,
  singleCommandSetYAML,
} from "~/metadata/forms/commonObjects/commandSet/__fixtures__/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportCommandSetToYAML } from "./toYAML"

describe("exportCommandSetToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandSetToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export single command set", () => {
    const result = exportCommandSetToYAML(mockContext, mockRule, singleCommandSet)

    expect(result).toEqual(singleCommandSetYAML)
  })

  it("should export multiple command sets", () => {
    const result = exportCommandSetToYAML(mockContext, mockRule, multipleCommandSet)

    expect(result).toEqual(multipleCommandSetYAML)
  })
})
