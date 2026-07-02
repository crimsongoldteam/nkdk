import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { MetadataTaskRules } from "./rules"
import { MetadataTask } from "./types"

const normalizeXML = (value: string) => value.replace(/\r\n/g, "\n")

describe("import MetadataTask from XML", () => {
  it("imports full fixture with addressing attributes", () => {
    const result = testImportAppliedObjectFromXML<MetadataTask>({
      rule: MetadataTaskRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(result).toMatchObject({
      itemType: "MetadataTask",
      name: "ЗадачаВсеСвойства",
      addressing: "InformationRegister.РегистрСведенийАдресация",
      currentPerformer: "SessionParameter.ПараметрСеансаТекущийИсполнитель",
      commands: [{ name: "Команда1" }],
    })
    expect(result?.addressingAttributes?.map((attribute: { name: string }) => attribute.name)).toEqual([
      "РеквизитАдресацииВсеСвойства",
      "РеквизитАдресацииПоУмолчанию",
    ])
    expect(result?.addressingAttributes?.[0]?.addressingDimension).toBe(
      "InformationRegister.РегистрСведенийАдресация.Dimension.ИзмерениеАдресации"
    )
  })

  it("imports minimal fixture defaults", () => {
    const result = testImportAppliedObjectFromXML<MetadataTask>({
      rule: MetadataTaskRules,
      importMetaUrl: import.meta.url,
      fixture: "minimal.xml",
    })

    expect(result).toMatchObject({
      itemType: "MetadataTask",
      name: "ЗадачаПоУмолчанию",
    })
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataTask>({
      rule: MetadataTaskRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataTaskRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeXML(result)).toEqual(normalizeXML(expected))
  })
})
