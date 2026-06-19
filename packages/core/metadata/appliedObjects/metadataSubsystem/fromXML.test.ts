import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataSubsystemRules } from "./rules"
import type { MetadataSubsystem } from "./types"

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n")

const cases = [
  { fixture: "full.xml", name: "ПодсистемаВсеСвойства" },
  { fixture: "all-targets.xml", name: "ПодсистемаВсеСвойства" },
  { fixture: "minimal.xml", name: "ПодсистемаПоУмолчанию" },
]

describe("import MetadataSubsystem from XML", () => {
  it.each(cases)("imports $fixture", ({ fixture, name }) => {
    expect(
      testImportAppliedObjectFromXML<MetadataSubsystem>({
        rule: MetadataSubsystemRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
    ).toMatchObject({ itemType: "MetadataSubsystem", name })
  })

  it.each(cases)("round-trips $fixture", ({ fixture }) => {
    const data = testImportAppliedObjectFromXML<MetadataSubsystem>({
      rule: MetadataSubsystemRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataSubsystemRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeXML(result)).toEqual(normalizeXML(expected))
  })
})
