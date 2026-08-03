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

  it("сохраняет одиночную корневую группу вместе с вложенными группами", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: undefined,
      xmlRootTag: "dcsset:item",
      xmlString: `<dcsset:item
        xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings"
        xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:xs="http://www.w3.org/2001/XMLSchema"
        xmlns:v8="http://v8.1c.ru/8.1/data/core"
        xsi:type="dcsset:FilterItemGroup">
        <dcsset:use>false</dcsset:use>
        <dcsset:groupType>OrGroup</dcsset:groupType>
        <dcsset:item xsi:type="dcsset:FilterItemGroup">
          <dcsset:groupType>AndGroup</dcsset:groupType>
          <dcsset:item xsi:type="dcsset:FilterItemComparison">
            <dcsset:left xsi:type="dcscor:Field">Ссылка</dcsset:left>
            <dcsset:comparisonType>Equal</dcsset:comparisonType>
            <dcsset:right xsi:type="xs:boolean">true</dcsset:right>
          </dcsset:item>
          <dcsset:item xsi:type="dcsset:FilterItemGroup">
            <dcsset:groupType>NotGroup</dcsset:groupType>
            <dcsset:item xsi:type="dcsset:FilterItemGroup">
              <dcsset:groupType>OrGroup</dcsset:groupType>
              <dcsset:item xsi:type="dcsset:FilterItemComparison">
                <dcsset:left xsi:type="dcscor:Field">ПометкаУдаления</dcsset:left>
                <dcsset:comparisonType>Equal</dcsset:comparisonType>
                <dcsset:right xsi:type="xs:boolean">true</dcsset:right>
              </dcsset:item>
            </dcsset:item>
          </dcsset:item>
        </dcsset:item>
        <dcsset:presentation xsi:type="v8:LocalStringType">
          <v8:item>
            <v8:lang>ru</v8:lang>
            <v8:content>Корневая группа</v8:content>
          </v8:item>
        </dcsset:presentation>
        <dcsset:viewMode>Normal</dcsset:viewMode>
        <dcsset:userSettingID>11111111-1111-1111-1111-111111111111</dcsset:userSettingID>
      </dcsset:item>`,
    })

    expect(result).toMatchObject({
      Элементы: [
        {
          Использование: "Ложь",
          ТипГруппы: "ГруппаИли",
          Представление: {
            Тип: "МногоязычнаяСтрока",
            Значение: "Корневая группа",
          },
          РежимОтображения: "Обычный",
          ИспользоватьПользовательскуюНастройку: "11111111-1111-1111-1111-111111111111",
          Элементы: [
            {
              ТипГруппы: "ГруппаИ",
              Элементы: [
                { ЛевоеЗначение: ".Ссылка" },
                {
                  ТипГруппы: "ГруппаНе",
                  Элементы: [
                    {
                      ТипГруппы: "ГруппаИли",
                      Элементы: [{ ЛевоеЗначение: ".ПометкаУдаления" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
  })

  it("сохраняет несколько корневых элементов без дополнительной группы", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: undefined,
      yaml: [
        {
          ТипГруппы: "ГруппаИли",
          Элементы: [fullFilterItemComparisonYAML],
        },
        fullFilterItemComparisonYAML,
      ],
    })

    expect(result).toMatchObject({
      Элементы: [
        {
          ТипГруппы: "ГруппаИли",
          Элементы: [expect.objectContaining({ ЛевоеЗначение: ".Ссылка" })],
        },
        expect.objectContaining({ ЛевоеЗначение: ".Ссылка" }),
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
