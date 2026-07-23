import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
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

const groupYAML = (groupType: "ГруппаИ" | "ГруппаИли", extra: Record<string, unknown> = {}) => ({
  ТипГруппы: groupType,
  ИспользоватьПользовательскуюНастройку: "Истина",
  ...extra,
})

const groupXML = (
  groupType: "AndGroup" | "OrGroup",
  guid?: string,
  extra: Record<string, unknown> = {}
): Record<string, unknown> => ({
  "_xsi:type": "dcsset:FilterItemGroup",
  "dcsset:groupType": groupType,
  ...(guid === undefined ? {} : { "dcsset:userSettingID": guid }),
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

  describe("semantic reference matching", () => {
    const guidA = "aaaaaaaa-0000-0000-0000-000000000001"
    const guidB = "bbbbbbbb-0000-0000-0000-000000000002"

    const itemA: FilterItemComparison = {
      itemType: "FilterItemComparison",
      leftValue: { type: "Field", value: "Ссылка" },
      comparisonType: "Equal",
      userSettingID: true,
    }
    const itemB: FilterItemComparison = {
      itemType: "FilterItemComparison",
      leftValue: { type: "Field", value: "Статус" },
      comparisonType: "Equal",
      userSettingID: true,
    }

    it("FilterItemComparison: сопоставляет по leftValue+comparisonType, а не по индексу", () => {
      // current: [A, B], reference: [B, A] — порядок обратный
      const { result } = testExportPropertyModelThroughYAMLToXML({
        rule,
        value: [itemA, itemB],
        yaml: [comparisonYAML("Ссылка"), comparisonYAML("Статус")],
        xmlRootTag: "dcsset:item",
        referenceMetadata: [comparisonXML("Статус", guidB), comparisonXML("Ссылка", guidA)],
      })

      // A должен получить GUID-A и идти раньше B с GUID-B
      expect(result).toContain(guidA)
      expect(result).toContain(guidB)
      expect(result.indexOf(guidA)).toBeLessThan(result.indexOf(guidB))
    })

    it("FilterItemComparison: элемент без совпадения в референсе не получает GUID", () => {
      // reference содержит только B
      const { result } = testExportPropertyModelThroughYAMLToXML({
        rule,
        value: [itemA, itemB],
        yaml: [comparisonYAML("Ссылка"), comparisonYAML("Статус")],
        xmlRootTag: "dcsset:item",
        referenceMetadata: [comparisonXML("Статус", guidB)],
      })

      expect(result).not.toContain(guidA)
      expect(result).toContain(guidB)
    })

    it("FilterItemGroup: сопоставляет по groupType", () => {
      const guidOrGroup = "cccccccc-0000-0000-0000-000000000003"
      const guidAndGroup = "dddddddd-0000-0000-0000-000000000004"

      const orGroup: FilterItemGroup = { itemType: "FilterItemGroup", groupType: "OrGroup", userSettingID: true }
      const andGroup: FilterItemGroup = { itemType: "FilterItemGroup", groupType: "AndGroup", userSettingID: true }
      // current: [OrGroup, AndGroup], reference: [AndGroup, OrGroup]
      const { result } = testExportPropertyModelThroughYAMLToXML({
        rule,
        value: [orGroup, andGroup],
        yaml: [groupYAML("ГруппаИли"), groupYAML("ГруппаИ")],
        xmlRootTag: "dcsset:item",
        referenceMetadata: [groupXML("AndGroup", guidAndGroup), groupXML("OrGroup", guidOrGroup)],
      })

      expect(result).toContain(guidOrGroup)
      expect(result).toContain(guidAndGroup)
      expect(result.indexOf(guidOrGroup)).toBeLessThan(result.indexOf(guidAndGroup))
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

    it("FilterItemComparison: сохраняет xs:string userSettingPresentation из reference", () => {
      const guid = "eeeeeeee-0000-0000-0000-000000000005"
      const current: FilterItemComparison = {
        itemType: "FilterItemComparison",
        leftValue: { type: "Field", value: "ТипОплаты" },
        comparisonType: "Equal",
        userSettingID: true,
        userSettingPresentation: { items: { ru: "Способ оплаты" } },
      }
      const { result } = testExportPropertyModelThroughYAMLToXML({
        rule,
        value: [current],
        yaml: [
          comparisonYAML("ТипОплаты", {
            ПредставлениеПользовательскойНастройки: "Способ оплаты",
          }),
        ],
        xmlRootTag: "dcsset:item",
        referenceMetadata: [
          comparisonXML("ТипОплаты", guid, {
            "dcsset:userSettingPresentation": { "_xsi:type": "xs:string", "#text": "Способ оплаты" },
          }),
        ],
      })

      expect(result).toContain(`<dcsset:userSettingID>${guid}</dcsset:userSettingID>`)
      expect(result).toContain(
        `<dcsset:userSettingPresentation xsi:type="xs:string">Способ оплаты</dcsset:userSettingPresentation>`
      )
      expect(result).not.toContain(`xsi:type="v8:LocalStringType"`)
    })

    it("FilterItemComparison: сопоставляет implicit Equal и поле с точкой из YAML", () => {
      const guid = "eeeeeeee-0000-0000-0000-000000000007"
      const current: FilterItemComparison = {
        itemType: "FilterItemComparison",
        leftValue: { type: "Field", value: ".ТипОплаты" },
        userSettingID: true,
        userSettingPresentation: { items: { ru: "Способ оплаты" } },
      }
      const { result } = testExportPropertyModelThroughYAMLToXML({
        rule,
        value: [current],
        yaml: [
          comparisonYAML(".ТипОплаты", {
            ПредставлениеПользовательскойНастройки: "Способ оплаты",
          }),
        ],
        xmlRootTag: "dcsset:item",
        referenceMetadata: [
          comparisonXML("ТипОплаты", guid, {
            "dcsset:userSettingPresentation": { "_xsi:type": "xs:string", "#text": "Способ оплаты" },
          }),
        ],
      })

      expect(result).toContain(`<dcsset:userSettingID>${guid}</dcsset:userSettingID>`)
      expect(result).toContain(
        `<dcsset:userSettingPresentation xsi:type="xs:string">Способ оплаты</dcsset:userSettingPresentation>`
      )
    })

    it("FilterItemGroup: передает reference во вложенный FilterItemComparison", () => {
      const guid = "ffffffff-0000-0000-0000-000000000006"
      const currentNested: FilterItemComparison = {
        itemType: "FilterItemComparison",
        leftValue: { type: "Field", value: "Контрагент" },
        comparisonType: "Equal",
        userSettingID: true,
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
                ПредставлениеПользовательскойНастройки: "Контрагент",
              }),
            ],
          }),
        ],
        xmlRootTag: "dcsset:item",
        referenceMetadata: [
          groupXML("AndGroup", undefined, {
            "dcsset:item": [
              comparisonXML("Контрагент", guid, {
                "dcsset:userSettingPresentation": { "_xsi:type": "xs:string", "#text": "Контрагент" },
              }),
            ],
          }),
        ],
      })

      expect(result).toContain(`<dcsset:userSettingID>${guid}</dcsset:userSettingID>`)
      expect(result).toContain(
        `<dcsset:userSettingPresentation xsi:type="xs:string">Контрагент</dcsset:userSettingPresentation>`
      )
    })
  })
})
