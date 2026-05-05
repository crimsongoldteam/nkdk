import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToYAML } from "~/tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { withNumerator, withNumeratorYAML } from "./__fixtures__/withNumerator"
import { MetadataDocumentRules } from "./rules"
import { MetadataDocument } from "./types"

describe("export MetadataDocument to YAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = testExportAppliedObjectToYAML<MetadataDocument>({
      rule: MetadataDocumentRules,
      data: undefined,
    })
    expect(result).toBeUndefined()
  })

  it.each([
    { name: "full", data: full, expected: fullYAML },
    { name: "minimal", data: minimal, expected: minimalYAML },
    { name: "withNumerator", data: withNumerator, expected: withNumeratorYAML },
  ])("should export $name", ({ data, expected }) => {
    const result = testExportAppliedObjectToYAML<MetadataDocument>({
      rule: MetadataDocumentRules,
      data,
    })
    expect(result).toEqual(expected)
  })
})
