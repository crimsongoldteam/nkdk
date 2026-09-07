import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../ruleRuntime"
import { testExportPropertyModelThroughYAMLToXML } from "../../../../tests/property/exportPropertyModelThroughYAMLToXML"
import {
  fullFilterItemComparison,
  fullFilterItemComparisonYAML,
  fullFilterItemGroup,
  fullFilterItemGroupYAML,
  inListFilterItemComparison,
  inListFilterItemComparisonYAML,
  inListWithNilFilterItemComparison,
} from "./__fixtures__/data"
import "./types"
import { FilterItemComparison, FilterItemGroup } from "./types"

const rule: PropertyRule = {
  type: "FilterItem",
}

const comparisonYAML = (field: string, extra: Record<string, unknown> = {}) => ({
  ЛевоеЗначение: `.${field.replace(/^\./, "")}`,
  ИспользоватьПользовательскуюНастройку: "Истина",
  ...extra,
})

const comparisonXML = (field: string, guid: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  "_xsi:type": "dcsset:FilterItemComparison",
  "dcsset:left": { "_xsi:type": "dcscor:Field", "#text": field.replace(/^\./, "") },
  "dcsset:comparisonType": "Equal",
  "dcsset:userSettingID": guid,
  ...extra,
})

const groupYAML = (groupType: "ГруппаИ" | "ГруппаИли" | "ГруппаНе", extra: Record<string, unknown> = {}) => ({
  ТипГруппы: groupType,
  ИспользоватьПользовательскуюНастройку: "Истина",
  ...extra,
})

describe("export FilterItem to XML", () => {
  it("exports FilterItemComparison to XML", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: [fullFilterItemComparison],
      yaml: [fullFilterItemComparisonYAML],
      xmlRootTag: "dcsset:item",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("restores implicit Equal comparisonType to XML", () => {
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: [
        {
          itemType: "FilterItemComparison",
          leftValue: { type: "Field", value: "Список.Порядок" },
          rightValue: { type: "Order" },
        },
      ],
      xmlRootTag: "dcsset:item",
    })

    expect(result).toContain("<dcsset:comparisonType>Equal</dcsset:comparisonType>")
  })

  it("exports FilterItemComparison InList (массив rightValue) to XML", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: [inListFilterItemComparison],
      yaml: [inListFilterItemComparisonYAML],
      xmlRootTag: "dcsset:item",
      path: "inList.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports FilterItemComparison InList with xsi:nil to XML", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: [inListWithNilFilterItemComparison],
      yaml: [
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
      xmlRootTag: "dcsset:item",
      path: "inListWithNil.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports FilterItemGroup to XML", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: [fullFilterItemGroup],
      yaml: [fullFilterItemGroupYAML],
      xmlRootTag: "dcsset:item",
      path: "full-group.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  describe("идентификаторы пользовательских настроек из YAML", () => {
    const guidA = "aaaaaaaa-0000-0000-0000-000000000001"
    const guidB = "bbbbbbbb-0000-0000-0000-000000000002"

    const itemA: FilterItemComparison = {
      itemType: "FilterItemComparison",
      leftValue: { type: "Field", value: "Ссылка" },
      comparisonType: "Equal",
      userSettingID: guidA,
    }
    const itemB: FilterItemComparison = {
      itemType: "FilterItemComparison",
      leftValue: { type: "Field", value: "Статус" },
      comparisonType: "Equal",
      userSettingID: guidB,
    }

    it("FilterItemComparison: сохраняет идентификаторы и порядок без reference", () => {
      const { result } = testExportPropertyModelThroughYAMLToXML({
        rule,
        value: [itemA, itemB],
        yaml: [
          comparisonYAML("Ссылка", { ИспользоватьПользовательскуюНастройку: guidA }),
          comparisonYAML("Статус", { ИспользоватьПользовательскуюНастройку: guidB }),
        ],
        xmlRootTag: "dcsset:item",
      })

      // A должен получить GUID-A и идти раньше B с GUID-B
      expect(result).toContain(guidA)
      expect(result).toContain(guidB)
      expect(result.indexOf(guidA)).toBeLessThan(result.indexOf(guidB))
    })

    it("FilterItemComparison: элемент без идентификатора в YAML не получает чужой GUID", () => {
      const { result } = testExportPropertyModelThroughYAMLToXML({
        rule,
        value: [{ ...itemA, userSettingID: true }, itemB],
        yaml: [comparisonYAML("Ссылка"), comparisonYAML("Статус", { ИспользоватьПользовательскуюНастройку: guidB })],
        xmlRootTag: "dcsset:item",
      })

      expect(result).not.toContain(guidA)
      expect(result).toContain(guidB)
    })

    it("FilterItemGroup: сохраняет идентификаторы трёх видов групп из YAML", () => {
      const guidOrGroup = "cccccccc-0000-0000-0000-000000000003"
      const guidAndGroup = "dddddddd-0000-0000-0000-000000000004"
      const guidNotGroup = "eeeeeeee-0000-0000-0000-000000000008"

      const orGroup: FilterItemGroup = { itemType: "FilterItemGroup", groupType: "OrGroup", userSettingID: guidOrGroup }
      const andGroup: FilterItemGroup = { itemType: "FilterItemGroup", groupType: "AndGroup", userSettingID: guidAndGroup }
      const notGroup: FilterItemGroup = { itemType: "FilterItemGroup", groupType: "NotGroup", userSettingID: guidNotGroup }
      const { result } = testExportPropertyModelThroughYAMLToXML({
        rule,
        value: [orGroup, andGroup, notGroup],
        yaml: [
          groupYAML("ГруппаИли", { ИспользоватьПользовательскуюНастройку: guidOrGroup }),
          groupYAML("ГруппаИ", { ИспользоватьПользовательскуюНастройку: guidAndGroup }),
          groupYAML("ГруппаНе", { ИспользоватьПользовательскуюНастройку: guidNotGroup }),
        ],
        xmlRootTag: "dcsset:item",
      })

      expect(result).toContain(guidOrGroup)
      expect(result).toContain(guidAndGroup)
      expect(result).toContain(guidNotGroup)
      expect(result.indexOf(guidOrGroup)).toBeLessThan(result.indexOf(guidAndGroup))
      expect(result.indexOf(guidAndGroup)).toBeLessThan(result.indexOf(guidNotGroup))
    })

    it("FilterItemComparison: не подставляет GUID при неоднозначном совпадении", () => {
      const current: FilterItemComparison = {
        itemType: "FilterItemComparison",
        leftValue: { type: "Field", value: "ТипОплаты" },
        comparisonType: "Equal",
        userSettingID: true,
      }

      const { result } = testExportPropertyModelThroughYAMLToXML({
        rule,
        value: [current],
        yaml: [comparisonYAML("ТипОплаты")],
        xmlRootTag: "dcsset:item",
        referenceMetadata: [
          comparisonXML("ТипОплаты", guidA, {
            "dcsset:right": { "_xsi:type": "xs:string", "#text": "Наличные" },
          }),
          comparisonXML("ТипОплаты", guidB, {
            "dcsset:right": { "_xsi:type": "xs:string", "#text": "Безналичные" },
          }),
        ],
      })

      expect(result).not.toContain(guidA)
      expect(result).not.toContain(guidB)
    })

    it("FilterItemComparison: восстанавливает обычное userSettingPresentation как LocalStringType", () => {
      const guid = "eeeeeeee-0000-0000-0000-000000000005"
      const current: FilterItemComparison = {
        itemType: "FilterItemComparison",
        leftValue: { type: "Field", value: "ТипОплаты" },
        comparisonType: "Equal",
        userSettingID: guid,
        userSettingPresentation: { items: { ru: "Способ оплаты" } },
      }
      const { result } = testExportPropertyModelThroughYAMLToXML({
        rule,
        value: [current],
        yaml: [
          comparisonYAML("ТипОплаты", {
            ИспользоватьПользовательскуюНастройку: guid,
            ПредставлениеПользовательскойНастройки: "Способ оплаты",
          }),
        ],
        xmlRootTag: "dcsset:item",
      })

      expect(result).toContain(`<dcsset:userSettingID>${guid}</dcsset:userSettingID>`)
      expect(result).toContain('<dcsset:userSettingPresentation xsi:type="v8:LocalStringType">')
      expect(result).toContain("<v8:content>Способ оплаты</v8:content>")
    })

    it("FilterItemComparison: восстанавливает implicit Equal и поле с точкой из YAML", () => {
      const guid = "eeeeeeee-0000-0000-0000-000000000007"
      const current: FilterItemComparison = {
        itemType: "FilterItemComparison",
        leftValue: { type: "Field", value: ".ТипОплаты" },
        userSettingID: guid,
        userSettingPresentation: { items: { ru: "Способ оплаты" } },
      }
      const { result } = testExportPropertyModelThroughYAMLToXML({
        rule,
        value: [current],
        yaml: [
          comparisonYAML(".ТипОплаты", {
            ИспользоватьПользовательскуюНастройку: guid,
            ПредставлениеПользовательскойНастройки: "Способ оплаты",
          }),
        ],
        xmlRootTag: "dcsset:item",
      })

      expect(result).toContain(`<dcsset:userSettingID>${guid}</dcsset:userSettingID>`)
      expect(result).toContain('<dcsset:userSettingPresentation xsi:type="v8:LocalStringType">')
      expect(result).toContain("<v8:content>Способ оплаты</v8:content>")
    })

    it("FilterItemGroup: сохраняет GUID вложенного FilterItemComparison из YAML", () => {
      const guid = "ffffffff-0000-0000-0000-000000000006"
      const currentNested: FilterItemComparison = {
        itemType: "FilterItemComparison",
        leftValue: { type: "Field", value: "Контрагент" },
        comparisonType: "Equal",
        userSettingID: guid,
        userSettingPresentation: { items: { ru: "Контрагент" } },
      }
      const currentGroup: FilterItemGroup = {
        itemType: "FilterItemGroup",
        groupType: "AndGroup",
        items: [currentNested],
      }
      const { result } = testExportPropertyModelThroughYAMLToXML({
        rule,
        value: [currentGroup],
        yaml: [
          groupYAML("ГруппаИ", {
            ИспользоватьПользовательскуюНастройку: "Ложь",
            Элементы: [
              comparisonYAML("Контрагент", {
                ИспользоватьПользовательскуюНастройку: guid,
                ПредставлениеПользовательскойНастройки: "Контрагент",
              }),
            ],
          }),
        ],
        xmlRootTag: "dcsset:item",
      })

      expect(result).toContain(`<dcsset:userSettingID>${guid}</dcsset:userSettingID>`)
      expect(result).toContain('<dcsset:userSettingPresentation xsi:type="v8:LocalStringType">')
      expect(result).toContain("<v8:content>Контрагент</v8:content>")
    })
  })
})
