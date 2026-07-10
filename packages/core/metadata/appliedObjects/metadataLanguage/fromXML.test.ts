import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { MetadataLanguageRules } from "./rules"
const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n")

import type { MetadataLanguage } from "./types"

const cases = [
  { fixture: "ru.xml", name: "Русский", languageCode: "ru" },
  { fixture: "en.xml", name: "Английский", languageCode: "en" },
]

describe("import MetadataLanguage from XML", () => {
  it.each(cases)("imports $fixture", ({ fixture, name, languageCode }) => {
    expect(
      testImportAppliedObjectFromXML<MetadataLanguage>({
        rule: MetadataLanguageRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
    ).toMatchObject({ itemType: "MetadataLanguage", name, languageCode })
  })

  it.each(cases)("round-trips $fixture", ({ fixture }) => {
    const data = testImportAppliedObjectFromXML<MetadataLanguage>({
      rule: MetadataLanguageRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataLanguageRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeXML(result)).toEqual(normalizeXML(expected))
  })
})
