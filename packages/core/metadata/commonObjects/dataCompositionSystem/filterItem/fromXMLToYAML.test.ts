import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import {
  fullFilterItemComparison,
  fullFilterItemComparisonYAML,
  fullFilterItemGroup,
  inListFilterItemComparisonYAML,
} from "./__fixtures__/data"
import "./types"
import { explicitYAMLString } from "../../../../yaml/explicitString"

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

  it("exports FilterItemComparison InList to YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: undefined,
      path: "inList.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({ Элементы: [inListFilterItemComparisonYAML] })
  })

  it("exports FilterItemComparison InList with xsi:nil to YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: undefined,
      path: "inListWithNil.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({
      Элементы: [
        {
          ЛевоеЗначение: ".Объект.Корректировки.Документ",
          ВидСравнения: "ВСписке",
          ПравоеЗначение: [
            "Документ.ВыбытиеИнвестиций.ПустаяСсылка",
            "Документ.ПоступлениеИнвестиций.ПустаяСсылка",
            {},
          ],
        },
      ],
    })
  })

  it("preserves xs:string presentation in YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: undefined,
      xmlRootTag: "dcsset:item",
      xmlString: `<dcsset:item
        xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings"
        xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:type="dcsset:FilterItemComparison">
        <dcsset:left xsi:type="dcscor:Field">Ссылка.Реквизит1</dcsset:left>
        <dcsset:comparisonType>Equal</dcsset:comparisonType>
        <dcsset:right xsi:type="dcscor:Field">ПараметрыДанных.Параметр1</dcsset:right>
        <dcsset:presentation xsi:type="xs:string">Английское</dcsset:presentation>
      </dcsset:item>`,
    })

    expect(result).toEqual({
      Элементы: [
        {
          ЛевоеЗначение: ".Ссылка.Реквизит1",
          ПравоеЗначение: ".ПараметрыДанных.Параметр1",
          Представление: explicitYAMLString("Английское"),
        },
      ],
    })
  })
})
