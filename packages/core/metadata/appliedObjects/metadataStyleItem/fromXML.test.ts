import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { border } from "./__fixtures__/border"
import { color } from "./__fixtures__/color"
import { font } from "./__fixtures__/font"
import { MetadataStyleItemRules } from "./rules"
import { MetadataStyleItem } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

const fixtures = [
  ["font.xml", font],
  ["color.xml", color],
  ["border.xml", border],
] as const

describe("import MetadataStyleItem from XML", () => {
  it.each(fixtures)("should import %s", (fixture, expected) => {
    expect(
      testImportAppliedObjectFromXML<MetadataStyleItem>({
        rule: MetadataStyleItemRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
    ).toEqual(expected)
  })

  it.each(fixtures)("round-trip: %s — import затем export совпадает с исходным XML", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataStyleItem>({
      rule: MetadataStyleItemRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataStyleItemRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
