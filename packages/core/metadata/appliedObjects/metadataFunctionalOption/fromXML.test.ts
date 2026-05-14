import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataFunctionalOptionRules } from "./rules"
const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n")

import type { MetadataFunctionalOption } from "./types"

const cases = [
  { fixture: "full.xml", name: "ФункциональнаяОпцияВсеСвойства" },
  { fixture: "minimal.xml", name: "ФункциональнаяОпцияПоУмолчанию" },
]

describe("import MetadataFunctionalOption from XML", () => {
  it.each(cases)("imports $fixture", ({ fixture, name }) => {
    expect(
      testImportAppliedObjectFromXML<MetadataFunctionalOption>({
        rule: MetadataFunctionalOptionRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
    ).toMatchObject({ itemType: "MetadataFunctionalOption", name })
  })

  it.each(cases)("round-trips $fixture", ({ fixture }) => {
    const data = testImportAppliedObjectFromXML<MetadataFunctionalOption>({
      rule: MetadataFunctionalOptionRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataFunctionalOptionRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeXML(result)).toEqual(normalizeXML(expected))
  })
})
