import { describe, expect, it } from "vitest"
import { MetadataBusinessProcessRules } from "~/metadata/appliedObjects/metadataBusinessProcess/rules"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataChartOfAccountsRules } from "~/metadata/appliedObjects/metadataChartOfAccounts/rules"
import { MetadataChartOfCalculationTypesRules } from "~/metadata/appliedObjects/metadataChartOfCalculationTypes/rules"
import { MetadataChartOfCharacteristicTypesRules } from "~/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules"
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import { MetadataExchangePlanRules } from "~/metadata/appliedObjects/metadataExchangePlan/rules"
import { MetadataTaskRules } from "~/metadata/appliedObjects/metadataTask/rules"
import { MetadataExternalDataSourceTableRules } from "~/metadata/commonObjects/metadataExternalDataSourceTable/rules"
import {
  commonBasedOnObjectPaths,
  formatMetadataTargetToYAML,
  parseMetadataTargetFromModel,
  parseMetadataTargetFromYAML,
} from "./index"

describe("common basedOn metadata targets", () => {
  it("contains the shared object paths for basedOn", () => {
    expect(commonBasedOnObjectPaths).toEqual([
      ["ChartOfAccounts"],
      ["ExternalDataSource", "Table"],
      ["ExchangePlan"],
      ["Catalog"],
      ["Document"],
      ["ChartOfCharacteristicTypes"],
      ["BusinessProcess"],
      ["ChartOfCalculationTypes"],
      ["Task"],
    ])
  })

  it("parses and formats every allowed basedOn object path", () => {
    const constraint = { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths } as const

    const cases = [
      ["ПланСчетов.ПланСчетов1", "ChartOfAccounts.ПланСчетов1"],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Таблица.ТаблицаВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Table.ТаблицаВсеСвойства",
      ],
      ["ПланОбмена.ПланОбмена1", "ExchangePlan.ПланОбмена1"],
      ["Справочник.Номенклатура", "Catalog.Номенклатура"],
      ["Документ.ЗаказПокупателя", "Document.ЗаказПокупателя"],
      ["ПланВидовХарактеристик.ВидыСвойств", "ChartOfCharacteristicTypes.ВидыСвойств"],
      ["БизнесПроцесс.Согласование", "BusinessProcess.Согласование"],
      ["ПланВидовРасчета.Начисления", "ChartOfCalculationTypes.Начисления"],
      ["Задача.ЗадачаИсполнителя", "Task.ЗадачаИсполнителя"],
    ] as const

    for (const [yaml, canonical] of cases) {
      expect(parseMetadataTargetFromYAML({ value: yaml, constraint })).toMatchObject({ ok: true, canonical })
      expect(parseMetadataTargetFromModel({ canonical, constraint })).toMatchObject({ ok: true, canonical })
      expect(formatMetadataTargetToYAML({ canonical, constraint })).toBe(yaml)
    }
  })

  it("rejects object paths outside the shared basedOn allow-list", () => {
    const constraint = { kind: "object", allowedObjectPaths: commonBasedOnObjectPaths } as const

    expect(parseMetadataTargetFromYAML({ value: "Перечисление.Статусы", constraint })).toMatchObject({
      ok: false,
      code: "disallowed-kind",
    })

    expect(
      parseMetadataTargetFromModel({
        canonical: "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства",
        constraint,
      }),
    ).toMatchObject({ ok: false, code: "disallowed-kind" })
  })

  it("is used by every basedOn rule in scope", () => {
    const rules = [
      MetadataCatalogRules,
      MetadataDocumentRules,
      MetadataExchangePlanRules,
      MetadataTaskRules,
      MetadataBusinessProcessRules,
      MetadataChartOfAccountsRules,
      MetadataChartOfCharacteristicTypesRules,
      MetadataChartOfCalculationTypesRules,
      MetadataExternalDataSourceTableRules,
    ] as const

    for (const rule of rules) {
      expect(rule.properties.basedOn.metadataTarget).toEqual({
        kind: "object",
        allowedObjectPaths: commonBasedOnObjectPaths,
      })
    }
  })
})
