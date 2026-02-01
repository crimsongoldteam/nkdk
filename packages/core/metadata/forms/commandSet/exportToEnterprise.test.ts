import { describe, expect, it } from "vitest"
import {
  multipleCommandSet,
  multipleCommandSetEnterprise,
  singleCommandSet,
  singleCommandSetEnterprise,
} from "~/tests/fixtures/forms/commandSet/data"
import { mockContext } from "~/tests/mockContext"
import { exportCommandSetToEnterprise } from "./exportToEnterprise"

describe("exportCommandSetToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandSetToEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export single command set", () => {
    const result = exportCommandSetToEnterprise(mockContext, singleCommandSet)

    expect(result).toEqual(singleCommandSetEnterprise)
  })

  it("should export multiple command sets", () => {
    const result = exportCommandSetToEnterprise(mockContext, multipleCommandSet)

    expect(result).toEqual(multipleCommandSetEnterprise)
  })
})
