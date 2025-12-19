import { readFileSync } from "fs"
import { join } from "path"
import { assertEquals } from "typia"
import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { xmlExport } from "~/lib/xml/export/exporter"
import { oneLangI8nText } from "~/tests/fixtures/i8nText/oneLang"
import { twoLangsI8nText } from "~/tests/fixtures/i8nText/twoLangs"
import { exportI8nTextToXML } from "./exportToXML"
import { I8nTextXML } from "./types"

describe("exportI8nTextToXML", () => {
  it("should export I8nText to XML", () => {
    const expectedResult = readFileSync(join(process.cwd(), "tests/fixtures/i8nText/twoLangs.xml"), "utf-8")

    const originalContent = twoLangsI8nText

    const exported = exportI8nTextToXML(originalContent, mockConfigurationSettings)

    const xml = xmlExport({ Title: exported }, false)

    expect(assertEquals<I8nTextXML>(exported)).toEqual(exported)

    expect(xml).toEqual(expectedResult)
  })

  it("should export without formatted attribute", () => {
    const expectedResult = readFileSync(join(process.cwd(), "tests/fixtures/i8nText/oneLang.xml"), "utf-8").trimEnd()

    const originalContent = oneLangI8nText

    const exported = exportI8nTextToXML(originalContent, mockConfigurationSettings)

    const xml = xmlExport({ Title: exported }, false)

    expect(xml.trimEnd()).toEqual(expectedResult)
  })
})
