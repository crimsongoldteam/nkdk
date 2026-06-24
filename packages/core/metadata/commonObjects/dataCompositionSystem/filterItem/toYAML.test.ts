import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
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
          ИспользоватьПользовательскуюНастройку: "Истина",
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
          ИспользоватьПользовательскуюНастройку: "Истина",
        },
      ],
    })
  })
})
