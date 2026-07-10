import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML } from "../../../tests/appliedObject"
import { border } from "./__fixtures__/border"
import { color } from "./__fixtures__/color"
import { font } from "./__fixtures__/font"
import { MetadataStyleItemRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

const fixtures = [
  ["font.xml", font],
  ["color.xml", color],
  ["border.xml", border],
] as const

describe("export MetadataStyleItem to XML", () => {
  it.each(fixtures)("exports %s", (fixture, data) => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataStyleItemRules,
      importMetaUrl: import.meta.url,
      fixture,
      data,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
