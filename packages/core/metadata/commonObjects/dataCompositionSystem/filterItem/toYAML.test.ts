import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyToYAML } from "../../../../tests/property/exportPropertyToYAML"
import { fullFilterItemComparison, fullFilterItemGroup } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "FilterItem",
  yaml: "Элементы",
}

describe("export FilterItem to YAML", () => {
  it("exports FilterItemComparison to YAML", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: [fullFilterItemComparison],
    })

    expect(result).toEqual({
      Элементы: [
        {
          Использование: "Ложь",
          ЛевоеЗначение: ".Ссылка",
          ПравоеЗначение: "Справочник.Справочник1.ПустаяСсылка",
          Представление: {
            Тип: "МногоязычнаяСтрока",
            Значение: "Представление",
          },
          РежимОтображения: "Обычный",
          ИспользоватьПользовательскуюНастройку: "7b8eb4d9-8661-46f5-9da8-dbe4d77a2292",
          ПредставлениеПользовательскойНастройки: "Пользовательское представление",
        },
      ],
    })
  })

  it("exports FilterItemGroup to YAML", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: [fullFilterItemGroup],
    })

    expect(result).toEqual({
      Элементы: [
        {
          ТипГруппы: "ГруппаИли",
          Представление: {
            Тип: "МногоязычнаяСтрока",
            Значение: "Представление",
          },
          ПредставлениеПользовательскойНастройки: {
            Тип: "МногоязычнаяСтрока",
            Значение: "Пользовательское представление",
          },
          РежимОтображения: "Обычный",
          ИспользоватьПользовательскуюНастройку: "020f583f-ed48-47c1-b824-30b02c09aff9",
        },
      ],
    })
  })

  it("exports FilterItemGroup AndGroup with explicit group type", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: [{ itemType: "FilterItemGroup", groupType: "AndGroup", items: [fullFilterItemComparison] }],
    })

    expect(result).toMatchObject({
      Элементы: [
        {
          ТипГруппы: "ГруппаИ",
          Элементы: [expect.objectContaining({ ЛевоеЗначение: ".Ссылка" })],
        },
      ],
    })
  })
})
