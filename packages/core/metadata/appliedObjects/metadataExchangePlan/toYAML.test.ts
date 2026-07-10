import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToYAML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { MetadataExchangePlanRules } from "./rules"
import { MetadataExchangePlan } from "./types"

describe("export MetadataExchangePlan to YAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = testExportAppliedObjectToYAML<MetadataExchangePlan>({
      rule: MetadataExchangePlanRules,
      data: undefined,
    })
    expect(result).toBeUndefined()
  })

  it("exports full exchange plan YAML", () => {
    const data = testImportAppliedObjectFromXML<MetadataExchangePlan>({
      rule: MetadataExchangePlanRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })
    const result = testExportAppliedObjectToYAML<MetadataExchangePlan>({
      rule: MetadataExchangePlanRules,
      data,
    })

    expect(result).toMatchObject({
      Синоним: "Синоним",
      ДлинаКода: 11,
      ДлинаНаименования: 45,
      СтандартныеРеквизиты: expect.objectContaining({
        Ссылка: expect.any(Object),
        Наименование: expect.any(Object),
        Код: expect.any(Object),
      }),
      Реквизиты: expect.any(Object),
      ТабличныеЧасти: expect.any(Object),
      Команды: { Команда1: { Группа: "КоманднаяПанельФормыВажное" } },
    })
  })
})
