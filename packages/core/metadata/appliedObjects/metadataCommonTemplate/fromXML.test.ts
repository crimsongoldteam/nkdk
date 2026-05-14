import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataCommonTemplateRules } from "./rules"
const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n")

import type { MetadataCommonTemplate } from "./types"

const cases = [
  { fixture: "full.xml", name: "ТабличныйДокументВсеСвойства" },
  { fixture: "minimal.xml", name: "ТабличныйДокументПоУмолчанию" },
]

describe("import MetadataCommonTemplate from XML", () => {
  it.each(cases)("imports $fixture", ({ fixture, name }) => {
    expect(
      testImportAppliedObjectFromXML<MetadataCommonTemplate>({
        rule: MetadataCommonTemplateRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
    ).toMatchObject({ itemType: "MetadataCommonTemplate", name })
  })

  it.each(cases)("round-trips $fixture", ({ fixture }) => {
    const data = testImportAppliedObjectFromXML<MetadataCommonTemplate>({
      rule: MetadataCommonTemplateRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataCommonTemplateRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeXML(result)).toEqual(normalizeXML(expected))
  })
})
