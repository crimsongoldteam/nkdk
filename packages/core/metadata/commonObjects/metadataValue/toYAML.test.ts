import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { metadataValueFixtures } from "~/tests/fixtures/metadataValue/data"
import { exportMetadataValueToYAML } from "./toYAML"

describe("exportMetadataValueToYAML", () => {
  it.each(metadataValueFixtures)("should export $name value with type to YAML", (fixture) => {
    const result = exportMetadataValueToYAML(mockContext, fixture.ruleWithType as any, fixture.internalWithType as any)
    expect(result).toEqual(fixture.YAMLWithType)
  })

  it.each(metadataValueFixtures)("should export $name value to YAML", (fixture) => {
    const result = exportMetadataValueToYAML(mockContext, fixture.rule as any, fixture.internal as any)
    expect(result).toEqual(fixture.YAML)
  })
})
