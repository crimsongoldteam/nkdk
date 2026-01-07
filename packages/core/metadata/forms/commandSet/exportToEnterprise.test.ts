import { describe, expect, it } from "vitest"
import {
  multipleCommandSet,
  multipleCommandSetEnterprise,
  singleCommandSet,
  singleCommandSetEnterprise,
} from "~/tests/fixtures/forms/commandSet/data"
import { mockСontext } from "~/tests/mockContext"
import { exportCommandSetToEnterprise } from "./exportToEnterprise"

describe("exportCommandSetToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandSetToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export single command set", () => {
    const result = exportCommandSetToEnterprise(mockСontext, singleCommandSet)

    expect(result).toEqual(singleCommandSetEnterprise)
  })

  it("should export multiple command sets", () => {
    const result = exportCommandSetToEnterprise(mockСontext, multipleCommandSet)

    expect(result).toEqual(multipleCommandSetEnterprise)
  })
})
