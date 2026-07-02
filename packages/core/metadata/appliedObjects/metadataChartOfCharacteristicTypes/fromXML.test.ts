import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { MetadataChartOfCharacteristicTypesRules } from "./rules"
import { MetadataChartOfCharacteristicTypes } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("import MetadataChartOfCharacteristicTypes from XML", () => {
  it("imports chart of characteristic types fields and child objects", () => {
    const result = testImportAppliedObjectFromXML<MetadataChartOfCharacteristicTypes>({
      rule: MetadataChartOfCharacteristicTypesRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(result?.itemType).toBe("MetadataChartOfCharacteristicTypes")
    expect(result?.characteristicExtValues).toBe("Catalog.ЗначенияХарактеристик")
    expect(result?.hierarchical).toBe(true)
    expect(result?.foldersOnTop).toBe(false)
    expect(result?.tabularSections?.map(({ name }: { name: string }) => name)).toEqual(["ТабличнаяЧасть"])
    expect(result?.commands?.map(({ name }: { name: string }) => name)).toEqual(["ПолнаяКоманда", "ПоУмолчанию"])
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataChartOfCharacteristicTypes>({
      rule: MetadataChartOfCharacteristicTypesRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataChartOfCharacteristicTypesRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
