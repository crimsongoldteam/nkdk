import { describe, expect, it } from "vitest"
import {
  defaultMetadataCommands,
  defaultMetadataCommandsEnterprise,
  fullMetadataCommands,
  fullMetadataCommandsEnterprise,
} from "~/tests/fixtures/metadataCommand/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importMetadataCommandsFromEnterprise } from "./importFromEnterprise"

describe("importMetadataCommandFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataCommandsFromEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importMetadataCommandsFromEnterprise(mockContext, mockRule, fullMetadataCommandsEnterprise)

    expect(result).toEqual(fullMetadataCommands)
  })

  it("should import defaults", () => {
    const result = importMetadataCommandsFromEnterprise(mockContext, mockRule, defaultMetadataCommandsEnterprise)
    expect(result).toEqual(defaultMetadataCommands)
  })
})
