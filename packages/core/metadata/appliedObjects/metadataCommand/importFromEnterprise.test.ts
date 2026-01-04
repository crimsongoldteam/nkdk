import { describe, expect, it } from "vitest"
import {
  defaultMetadataCommands,
  defaultMetadataCommandsEnterprise,
  fullMetadataCommands,
  fullMetadataCommandsEnterprise,
} from "~/tests/fixtures/metadataCommand/data"
import { mockСontext } from "~/tests/mockContext"
import { importMetadataCommandsFromEnterprise } from "./importFromEnterprise"

describe("importMetadataCommandFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataCommandsFromEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importMetadataCommandsFromEnterprise(mockСontext, fullMetadataCommandsEnterprise)

    expect(result).toEqual(fullMetadataCommands)
  })

  it("should import defaults", () => {
    const result = importMetadataCommandsFromEnterprise(mockСontext, defaultMetadataCommandsEnterprise)
    expect(result).toEqual(defaultMetadataCommands)
  })
})
