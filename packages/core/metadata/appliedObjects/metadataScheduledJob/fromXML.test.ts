import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataScheduledJobRules } from "./rules"
const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n")

import type { MetadataScheduledJob } from "./types"

const cases = [
  { fixture: "full.xml", name: "РегламентноеЗаданиеВсеСвойства" },
  { fixture: "minimal.xml", name: "РегламентноеЗаданиеПоУмолчанию" },
]

describe("import MetadataScheduledJob from XML", () => {
  it.each(cases)("imports $fixture", ({ fixture, name }) => {
    expect(
      testImportAppliedObjectFromXML<MetadataScheduledJob>({
        rule: MetadataScheduledJobRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
    ).toMatchObject({ itemType: "MetadataScheduledJob", name })
  })

  it.each(cases)("round-trips $fixture", ({ fixture }) => {
    const data = testImportAppliedObjectFromXML<MetadataScheduledJob>({
      rule: MetadataScheduledJobRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataScheduledJobRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeXML(result)).toEqual(normalizeXML(expected))
  })
})
