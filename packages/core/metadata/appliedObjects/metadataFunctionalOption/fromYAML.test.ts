import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "../../orchestration"
import { mockContext } from "../../../tests/mockContext"
import { MetadataFunctionalOptionRules } from "./rules"

import "./types"

describe("import MetadataFunctionalOption from YAML", () => {
  it("imports object and accounting flag content targets", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule: MetadataFunctionalOptionRules,
      name: "ИспользоватьФинансовыеИнструменты",
      yaml: {
        СоставФункциональнойОпции: [
          "Подсистема.ФинансовыеИнструменты",
          "Константа.ВариантВставкиШтампа",
          "Документ.ЕжедневныйОтчет",
          "Документ.Корреспонденция.ТабличнаяЧасть.ВопросыОбращения",
          "Подсистема.СтандартныеПодсистемы.Подсистема.НапоминанияПользователя",
          "ПланВидовХарактеристик.ДополнительныеРеквизитыИСведения.Реквизит.ЗаголовокЯзык1",
          "ПланСчетов.Хозрасчетный.ПризнакУчета.УчетПоНаправлениямДеятельности",
          "Отчет.НормативныйСоставИзделия.Реквизит.Характеристика",
          "Отчет.СводныйОтчетЕГАИС.Команда.СформироватьСводныйОтчет",
        ],
      },
    })

    expect(result?.content).toEqual([
      "Subsystem.ФинансовыеИнструменты",
      "Constant.ВариантВставкиШтампа",
      "Document.ЕжедневныйОтчет",
      "Document.Корреспонденция.TabularSection.ВопросыОбращения",
      "Subsystem.СтандартныеПодсистемы.Subsystem.НапоминанияПользователя",
      "ChartOfCharacteristicTypes.ДополнительныеРеквизитыИСведения.Attribute.ЗаголовокЯзык1",
      "ChartOfAccounts.Хозрасчетный.AccountingFlag.УчетПоНаправлениямДеятельности",
      "Report.НормативныйСоставИзделия.Attribute.Характеристика",
      "Report.СводныйОтчетЕГАИС.Command.СформироватьСводныйОтчет",
    ])
  })
})
