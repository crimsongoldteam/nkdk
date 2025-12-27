import { describe, expect, it } from "vitest"
import { multipleCharacteristics } from "~/tests/fixtures/characteristicsDescription/multiple"
import { singleSimpleCharacteristic } from "~/tests/fixtures/characteristicsDescription/singleSimple"
import { mockСontext } from "~/tests/mockContext"
import {
  exportCharacteristicsDescriptionToEnterprise,
  exportCharacteristicsDescriptionsToEnterprise,
} from "./exportToEnterprise"
import { CharacteristicsDescriptionEnterprise } from "./types"

describe("exportCharacteristicsDescriptionToEnterprise", () => {
  it("should export single characteristic", () => {
    const mockData = singleSimpleCharacteristic

    const expectedResult: CharacteristicsDescriptionEnterprise = {
      ВидыХарактеристик: "ПланВидовХарактеристик.РеквизитыДляСписка",
      ПолеКлюча: "ПланВидовХарактеристик.РеквизитыДляСписка.СтандартныйРеквизит.Ссылка",
      ПолеОтбораВидов: "ПланВидовХарактеристик.РеквизитыДляСписка.СтандартныйРеквизит.ИмяПредопределенныхДанных",
      ЗначениеОтбораВидов: '"СегментыНоменклатуры"',
      ПолеИспользованияМножественныхЗначений: "ПланВидовХарактеристик.РеквизитыДляСписка.Реквизит.Множественный",
    }

    const result = exportCharacteristicsDescriptionToEnterprise(mockСontext, mockData)

    expect(result).toEqual(expectedResult)
  })

  it("should export multiple characteristics", () => {
    const mockData = multipleCharacteristics

    const expectedResult: CharacteristicsDescriptionEnterprise[] = [
      {
        ВидыХарактеристик: "Справочник.НаборыДополнительныхРеквизитовИСведений",
        ЗначенияХарактеристик: "Справочник.Номенклатура",
        ПолеКлюча:
          "Справочник.НаборыДополнительныхРеквизитовИСведений.ТабличнаяЧасть.ДополнительныеРеквизиты.Реквизит.Свойство",
        ПолеОтбораВидов:
          "Справочник.НаборыДополнительныхРеквизитовИСведений.ТабличнаяЧасть.ДополнительныеРеквизиты.Реквизит.ИмяПредопределенногоНабора",
        ЗначениеОтбораВидов: '"Справочник_Номенклатура"',
        ПолеОбъекта: "Справочник.Номенклатура.ТабличнаяЧасть.ДополнительныеРеквизиты.СтандартныйРеквизит.Ссылка",
        ПолеВида: "Справочник.Номенклатура.ТабличнаяЧасть.ДополнительныеРеквизиты.Реквизит.Свойство",
        ПолеЗначения: "Справочник.Номенклатура.ТабличнаяЧасть.ДополнительныеРеквизиты.Реквизит.Значение",
      },
      {
        ВидыХарактеристик: "Справочник.НаборыДополнительныхРеквизитовИСведений",
        ЗначенияХарактеристик: "РегистрСведений.ДополнительныеСведения",
        ПолеКлюча:
          "Справочник.НаборыДополнительныхРеквизитовИСведений.ТабличнаяЧасть.ДополнительныеСведения.Реквизит.Свойство",
        ПолеОтбораВидов:
          "Справочник.НаборыДополнительныхРеквизитовИСведений.ТабличнаяЧасть.ДополнительныеСведения.Реквизит.ИмяПредопределенногоНабора",
        ЗначениеОтбораВидов: '"Справочник_Номенклатура"',
        ПолеОбъекта: "РегистрСведений.ДополнительныеСведения.Измерение.Объект",
        ПолеВида: "РегистрСведений.ДополнительныеСведения.Измерение.Свойство",
        ПолеЗначения: "РегистрСведений.ДополнительныеСведения.Ресурс.Значение",
      },
    ]

    const result = exportCharacteristicsDescriptionsToEnterprise(mockСontext, mockData)

    expect(result).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportCharacteristicsDescriptionToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined for undefined array input", () => {
    const result = exportCharacteristicsDescriptionsToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
