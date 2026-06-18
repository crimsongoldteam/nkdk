import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToYAML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { explicitYAMLString } from "~/yaml/explicitString"
import { MetadataInformationRegisterRules } from "./rules"
import { MetadataInformationRegister } from "./types"

describe("export MetadataInformationRegister to YAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = testExportAppliedObjectToYAML<MetadataInformationRegister>({
      rule: MetadataInformationRegisterRules,
      data: undefined,
    })
    expect(result).toBeUndefined()
  })

  it.each([
    {
      fixture: "full.xml",
      expectations: {
        Периодичность: "День",
        ВключатьИтогиСрезПервых: "Истина",
        ВключатьИтогиСрезПоследних: "Истина",
      },
    },
    {
      fixture: "minimal.xml",
      expectations: {
        Ресурсы: {
          Ресурс1: {
            Тип: "Строка(10)",
            ЗначениеЗаполнения: explicitYAMLString(""),
          },
        },
      },
    },
    {
      fixture: "reg.xml",
      expectations: {
        РежимЗаписи: "ПодчинениеРегистратору",
        Измерения: {
          Измерение1: {
            Тип: "Строка(10)",
            ЗначениеЗаполнения: explicitYAMLString(""),
          },
        },
      },
    },
  ])("should export $fixture", ({ fixture, expectations }) => {
    const data = testImportAppliedObjectFromXML<MetadataInformationRegister>({
      rule: MetadataInformationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const result = testExportAppliedObjectToYAML<MetadataInformationRegister>({
      rule: MetadataInformationRegisterRules,
      data,
    })
    expect(result).toMatchObject(expectations)
  })
})
