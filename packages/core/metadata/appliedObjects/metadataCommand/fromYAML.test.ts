import { describe, expect, it } from "vitest"
import {
  defaultMetadataCommands,
  defaultMetadataCommandsYAML,
  fullMetadataCommands,
  fullMetadataCommandsYAML,
} from "~/tests/fixtures/metadataCommand/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importMetadataCommandsFromYAML } from "./fromYAML"

describe("importMetadataCommandFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataCommandsFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importMetadataCommandsFromYAML(mockContext, mockRule, fullMetadataCommandsYAML)

    expect(result).toEqual(fullMetadataCommands)
  })

  it("should import defaults", () => {
    const result = importMetadataCommandsFromYAML(mockContext, mockRule, defaultMetadataCommandsYAML)
    expect(result).toEqual(defaultMetadataCommands)
  })
})
