import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import {
  importStandardAttributeDescriptionFromEnterprise,
  importStandardAttributeDescriptionsFromEnterprise,
} from "./importFromEnterprise"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptionEnterprise,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
} from "./types"

describe("importStandardAttributeDescriptionFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importStandardAttributeDescriptionFromEnterprise(mockСontext, undefined, "ИмяПредопределенныхДанных")
    expect(result).toBeUndefined()
  })

  it("should import only one value from enterprise", () => {
    const data: StandardAttributeDescriptionEnterprise = {
      Синоним: "Какой-то синоним",
      ПроверкаЗаполнения: "ВыдаватьОшибку",
      БыстрыйВыбор: "Использовать",
      ВыделятьОтрицательные: "Истина",
      ЗаполнятьИзДанныхЗаполнения: "Ложь",
      ЗначениеЗаполнения: '"Текстовое значение"',
      ИсторияВыбораПриВводе: "Авто",
      ИсторияДанных: "Использовать",
      Комментарий: "Какой-то комментарий",
      МаксимальноеЗначение: 100,
      Маска: "999",
      МинимальноеЗначение: 0,
      МногострочныйРежим: "Истина",
      ПараметрыВыбора: "Отбор.Владелец(Справочник.Справочник1.Реквизит.Реквизит1)",
      Подсказка: "Подсказка для поля",
      ПолнотекстовыйПоиск: "Использовать",
      РасширенноеРедактирование: "Ложь",
      РежимПароля: "Истина",
      РежимСокращенияТипа: "Запрещать",
      СвязиПараметровВыбора: "Отбор.Владелец2(Справочник.Справочник2.Реквизит.Реквизит2)",
      СвязьПоТипу: "Справочник.КакойТоСправочник.Реквизит.КакойТоРеквизит",
      СозданиеПриВводе: "Авто",
      Тип: "Строка(10)",
      ФормаВыбора: "ФормаВыбора",
      Формат: "Формат",
      ФорматРедактирования: { ru: "Формат редактирования", en: "Edit format" },
    }

    const expectedResult: StandardAttributeDescription = {
      name: "PredefinedDataName",
      fillChecking: "ShowError",
      synonym: { items: { ru: "Какой-то синоним" } },
      quickChoice: "Use",
      markNegatives: true,
      fillValue: {
        type: "string",
        value: "Текстовое значение",
      },
      comment: "Какой-то комментарий",
      maxValue: 100,
      mask: "999",
      minValue: 0,
      multiLine: true,
      choiceParameters: [
        {
          name: "Отбор.Владелец",
          dataPath: "Catalog.Справочник1.Attribute.Реквизит1",
          valueChange: "Clear",
        },
      ],
      toolTip: { items: { ru: "Подсказка для поля" } },
      passwordMode: true,
      typeReductionMode: "Deny",
      choiceParameterLinks: [
        {
          name: "Отбор.Владелец2",
          dataPath: "Catalog.Справочник2.Attribute.Реквизит2",
          valueChange: "Clear",
        },
      ],
      linkByType: {
        dataPath: "Catalog.КакойТоСправочник.Attribute.КакойТоРеквизит",
        linkItem: 0,
      },
      type: {
        type: ["string"],
        stringQualifiers: { length: 10, allowedLength: "Variable" },
      },
      choiceForm: "ФормаВыбора",
      format: { items: { ru: "Формат" } },
      editFormat: { items: { ru: "Формат редактирования", en: "Edit format" } },
    }

    const result = importStandardAttributeDescriptionFromEnterprise(mockСontext, data, "ИмяПредопределенныхДанных")

    expect(result).toEqual(expectedResult)
  })

  it("should import standard attributes with name", () => {
    const data: StandardAttributeDescriptionsEnterprise = {
      ИмяПредопределенныхДанных: {
        Синоним: "Какой-то синоним",
        ПроверкаЗаполнения: "ВыдаватьОшибку",
      },
    }

    const expectedResult: StandardAttributeDescriptions = [
      {
        name: "PredefinedDataName",
        fillChecking: "ShowError",
        synonym: { items: { ru: "Какой-то синоним" } },
      },
    ]

    const result = importStandardAttributeDescriptionsFromEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })
})
