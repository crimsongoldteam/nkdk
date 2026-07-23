import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import { fullFilterItemComparison, fullFilterItemComparisonYAML, fullFilterItemGroup } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "FilterItem",
  yaml: "Элементы",
}

describe("export FilterItem to YAML", () => {
  it("exports FilterItemComparison to YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: [fullFilterItemComparison],
      path: "full.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
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
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: [fullFilterItemGroup],
      path: "full-group.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
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
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: [{ itemType: "FilterItemGroup", groupType: "AndGroup", items: [fullFilterItemComparison] }],
      yaml: [
        {
          ТипГруппы: "ГруппаИ",
          Элементы: [fullFilterItemComparisonYAML],
        },
      ],
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
