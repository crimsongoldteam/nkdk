import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToYAML } from "~/tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { MetadataHTTPServiceRules } from "./rules"
import { MetadataHTTPService } from "./types"

describe("export MetadataHTTPService to YAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = testExportAppliedObjectToYAML<MetadataHTTPService>({
      rule: MetadataHTTPServiceRules,
      data: undefined,
    })
    expect(result).toBeUndefined()
  })

  it.each([
    { name: "full", data: full, expected: fullYAML },
    { name: "minimal", data: minimal, expected: minimalYAML },
  ])("should export $name", ({ data, expected }) => {
    const result = testExportAppliedObjectToYAML<MetadataHTTPService>({
      rule: MetadataHTTPServiceRules,
      data,
    })
    expect(result).toEqual(expected)
  })
})
