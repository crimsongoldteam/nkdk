import { describe, expect, it } from "vitest"
import { testImportAppliedObjectFromYAML } from "~/tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { MetadataDocumentJournalRules } from "./rules"
import { MetadataDocumentJournal } from "./types"

describe("import MetadataDocumentJournal from YAML", () => {
  it("should import full", () => {
    const result = testImportAppliedObjectFromYAML<MetadataDocumentJournal>({
      rule: MetadataDocumentJournalRules,
      yaml: fullYAML,
      name: "ЖурналДокументовВсеСвойства",
    })
    expect(result).toEqual(full)
  })

  it("should import minimal", () => {
    const result = testImportAppliedObjectFromYAML<MetadataDocumentJournal>({
      rule: MetadataDocumentJournalRules,
      yaml: minimalYAML,
      name: "ЖурналДокументовПоУмолчанию",
    })
    expect(result).toEqual(minimal)
  })
})
