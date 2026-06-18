import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { MetadataFunctionalOptionRules } from "./rules"
import type { MetadataFunctionalOption } from "./types"

import "./types"

describe("export MetadataFunctionalOption to YAML", () => {
  it("exports object and accounting flag content targets", () => {
    const data: MetadataFunctionalOption = {
      itemType: "MetadataFunctionalOption",
      name: "ИспользоватьФинансовыеИнструменты",
      content: [
        "Subsystem.ФинансовыеИнструменты",
        "Constant.ВариантВставкиШтампа",
        "Document.ЕжедневныйОтчет",
        "Document.Корреспонденция.TabularSection.ВопросыОбращения",
        "Subsystem.СтандартныеПодсистемы.Subsystem.НапоминанияПользователя",
        "ChartOfCharacteristicTypes.ДополнительныеРеквизитыИСведения.Attribute.ЗаголовокЯзык1",
        "ChartOfAccounts.Хозрасчетный.AccountingFlag.УчетПоНаправлениямДеятельности",
      ],
    }

    const result = exportMetadataItemToYAML({
      context: mockContext,
      rule: MetadataFunctionalOptionRules,
      data,
    })

    expect(result).toEqual({
      СоставФункциональнойОпции: [
        "Подсистема.ФинансовыеИнструменты",
        "Константа.ВариантВставкиШтампа",
        "Документ.ЕжедневныйОтчет",
        "Документ.Корреспонденция.ТабличнаяЧасть.ВопросыОбращения",
        "Подсистема.СтандартныеПодсистемы.Подсистема.НапоминанияПользователя",
        "ПланВидовХарактеристик.ДополнительныеРеквизитыИСведения.Реквизит.ЗаголовокЯзык1",
        "ПланСчетов.Хозрасчетный.ПризнакУчета.УчетПоНаправлениямДеятельности",
      ],
    })
  })

  it("rejects unsupported content targets", () => {
    const data: MetadataFunctionalOption = {
      itemType: "MetadataFunctionalOption",
      name: "ИспользоватьМакет",
      content: ["CommonTemplate.ПечатнаяФорма"],
    }

    expect(() =>
      exportMetadataItemToYAML({
        context: mockContext,
        rule: MetadataFunctionalOptionRules,
        data,
      })
    ).toThrow()
  })
})
