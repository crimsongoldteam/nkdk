import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataStyleRules } from "./rules"
const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n")

import type { MetadataStyle } from "./types"

const cases = [
  { fixture: "full.xml", name: "СтильВсеСвойства" },
  { fixture: "minimal.xml", name: "СтильПоУмолчанию" },
]

describe("import MetadataStyle from XML", () => {
  it.each(cases)("imports $fixture", ({ fixture, name }) => {
    expect(
      testImportAppliedObjectFromXML<MetadataStyle>({
        rule: MetadataStyleRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
    ).toMatchObject({ itemType: "MetadataStyle", name })
  })

  it.each(cases)("round-trips $fixture", ({ fixture }) => {
    const data = testImportAppliedObjectFromXML<MetadataStyle>({
      rule: MetadataStyleRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataStyleRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeXML(result)).toEqual(normalizeXML(expected))
  })
})
