import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToYAML } from "../../../tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { MetadataDocumentJournalRules } from "./rules"
import { MetadataDocumentJournal } from "./types"

describe("export MetadataDocumentJournal to YAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = testExportAppliedObjectToYAML<MetadataDocumentJournal>({
      rule: MetadataDocumentJournalRules,
      data: undefined,
    })
    expect(result).toBeUndefined()
  })

  it.each([
    { name: "full", data: full, expected: fullYAML },
    { name: "minimal", data: minimal, expected: minimalYAML },
  ])("should export $name", ({ data, expected }) => {
    const result = testExportAppliedObjectToYAML<MetadataDocumentJournal>({
      rule: MetadataDocumentJournalRules,
      data,
    })
    expect(result).toEqual(expected)
  })
})
