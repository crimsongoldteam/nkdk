import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { MetadataCommonPictureRules } from "./rules"
const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n")

import type { MetadataCommonPicture } from "./types"

const cases = [
  { fixture: "full.xml", name: "ОбщаяКартинкаВсеСвойства" },
  { fixture: "minimal.xml", name: "ОбщаяКартинкаПоУмолчанию" },
  { fixture: "single.xml", name: "ОбщаяКартинкаОднаКартинка" },
  { fixture: "collection.xml", name: "ОбщаяКартинкаРежимКоллекции" },
]

describe("import MetadataCommonPicture from XML", () => {
  it.each(cases)("imports $fixture", ({ fixture, name }) => {
    expect(
      testImportAppliedObjectFromXML<MetadataCommonPicture>({
        rule: MetadataCommonPictureRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
    ).toMatchObject({ itemType: "MetadataCommonPicture", name })
  })

  it.each(cases)("round-trips $fixture", ({ fixture }) => {
    const data = testImportAppliedObjectFromXML<MetadataCommonPicture>({
      rule: MetadataCommonPictureRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataCommonPictureRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeXML(result)).toEqual(normalizeXML(expected))
  })
})
