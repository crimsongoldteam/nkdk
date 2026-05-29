import { describe, expect, it } from "vitest"
import { topLevelGraphImportSpecs } from "./registerTopLevelGraphImports"

describe("topLevelGraphImportSpecs", () => {
  it("экспортирует каталоги всех верхнеуровневых регистраций графа", () => {
    expect(topLevelGraphImportSpecs.map((spec) => spec.dir)).toEqual([
      "Справочник",
      "Документ",
      "Перечисление",
      "Обработка",
      "ЖурналДокументов",
      "HTTPСервис",
      "РегистрСведений",
      "РегистрНакопления",
      "ПланОбмена",
      "ОпределяемыйТип",
      "ПланВидовХарактеристик",
      "ПланСчетов",
      "ПланВидовРасчета",
      "БизнесПроцесс",
      "Задача",
      "ВнешнийИсточникДанных",
    ])
  })

  it("содержит rule для каждого зарегистрированного kind", () => {
    expect(
      topLevelGraphImportSpecs.map((spec) => ({
        kind: spec.kind,
        dir: spec.dir,
        itemType: spec.rule.itemType,
        prefix: spec.rule.itemTypePrefix,
      })),
    ).toEqual([
      {
        kind: "catalog",
        dir: "Справочник",
        itemType: "MetadataCatalog",
        prefix: "Справочник",
      },
      {
        kind: "document",
        dir: "Документ",
        itemType: "MetadataDocument",
        prefix: "Документ",
      },
      {
        kind: "enumeration",
        dir: "Перечисление",
        itemType: "MetadataEnumeration",
        prefix: "Перечисление",
      },
      {
        kind: "dataProcessor",
        dir: "Обработка",
        itemType: "MetadataDataProcessor",
        prefix: "Обработка",
      },
      {
        kind: "documentJournal",
        dir: "ЖурналДокументов",
        itemType: "MetadataDocumentJournal",
        prefix: "ЖурналДокументов",
      },
      {
        kind: "httpService",
        dir: "HTTPСервис",
        itemType: "MetadataHTTPService",
        prefix: "HTTPСервис",
      },
      {
        kind: "informationRegister",
        dir: "РегистрСведений",
        itemType: "MetadataInformationRegister",
        prefix: "РегистрСведений",
      },
      {
        kind: "accumulationRegister",
        dir: "РегистрНакопления",
        itemType: "MetadataAccumulationRegister",
        prefix: "РегистрНакопления",
      },
      {
        kind: "exchangePlan",
        dir: "ПланОбмена",
        itemType: "MetadataExchangePlan",
        prefix: "ПланОбмена",
      },
      {
        kind: "definedType",
        dir: "ОпределяемыйТип",
        itemType: "MetadataDefinedType",
        prefix: "ОпределяемыйТип",
      },
      {
        kind: "chartOfCharacteristicTypes",
        dir: "ПланВидовХарактеристик",
        itemType: "MetadataChartOfCharacteristicTypes",
        prefix: "ПланВидовХарактеристик",
      },
      {
        kind: "chartOfAccounts",
        dir: "ПланСчетов",
        itemType: "MetadataChartOfAccounts",
        prefix: "ПланСчетов",
      },
      {
        kind: "chartOfCalculationTypes",
        dir: "ПланВидовРасчета",
        itemType: "MetadataChartOfCalculationTypes",
        prefix: "ПланВидовРасчета",
      },
      {
        kind: "businessProcess",
        dir: "БизнесПроцесс",
        itemType: "MetadataBusinessProcess",
        prefix: "БизнесПроцесс",
      },
      {
        kind: "task",
        dir: "Задача",
        itemType: "MetadataTask",
        prefix: "Задача",
      },
      {
        kind: "externalDataSource",
        dir: "ВнешнийИсточникДанных",
        itemType: "MetadataExternalDataSource",
        prefix: "ВнешнийИсточникДанных",
      },
    ])
  })
})
