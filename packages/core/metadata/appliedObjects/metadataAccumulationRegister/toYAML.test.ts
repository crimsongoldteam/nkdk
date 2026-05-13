import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToYAML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataAccumulationRegisterRules } from "./rules"
import { MetadataAccumulationRegister } from "./types"

describe("export MetadataAccumulationRegister to YAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = testExportAppliedObjectToYAML<MetadataAccumulationRegister>({
      rule: MetadataAccumulationRegisterRules,
      data: undefined,
    })
    expect(result).toBeUndefined()
  })

  it("exports turnover-specific fields and hides scalar defaults", () => {
    const data = testImportAppliedObjectFromXML<MetadataAccumulationRegister>({
      rule: MetadataAccumulationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })
    const result = testExportAppliedObjectToYAML<MetadataAccumulationRegister>({
      rule: MetadataAccumulationRegisterRules,
      data,
    })

    expect(result).toMatchObject({
      ВидРегистра: "Обороты",
      РазделениеИтогов: "Ложь",
      Ресурсы: {
        РесурсВсеСвойства: {
          Тип: "Число(10, 0)",
          ПолнотекстовыйПоиск: "НеИспользовать",
        },
      },
      Измерения: {
        ИзмерениеВсеСвойства: {
          Тип: "Число(10, 0)",
        },
      },
      Реквизиты: {
        РеквизитВсеСвойства: {
          Тип: "Строка(10)",
        },
      },
    })
    const dimensions = (result as { Измерения?: Record<string, unknown> } | undefined)?.Измерения
    expect(dimensions?.ИзмерениеВсеСвойства).not.toHaveProperty("ИспользоватьВИтогах")
  })

  it("exports minimal resource as fixture content, not as default", () => {
    const data = testImportAppliedObjectFromXML<MetadataAccumulationRegister>({
      rule: MetadataAccumulationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture: "minimal.xml",
    })
    const result = testExportAppliedObjectToYAML<MetadataAccumulationRegister>({
      rule: MetadataAccumulationRegisterRules,
      data,
    })

    expect(result).toMatchObject({
      Ресурсы: {
        Ресурс1: "Число(10, 0)",
      },
    })
    expect(result).not.toHaveProperty("ВидРегистра")
    expect(result).not.toHaveProperty("РазделениеИтогов")
  })
})
