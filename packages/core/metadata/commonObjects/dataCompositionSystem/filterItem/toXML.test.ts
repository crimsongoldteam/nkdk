import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyToXML } from "../../../../tests/property/exportPropertyToXML"
import {
  fullFilterItemComparison,
  fullFilterItemGroup,
  inListFilterItemComparison,
  inListWithNilFilterItemComparison,
} from "./__fixtures__/data"
import "./types"
import { FilterItemComparison, FilterItemGroup } from "./types"

const rule: PropertyRule = {
  type: "FilterItem",
}

type FilterItemComparisonReference = Omit<FilterItemComparison, "userSettingPresentation"> & {
  userSettingPresentation?: FilterItemComparison["userSettingPresentation"] | string
}

type FilterItemGroupReference = Omit<FilterItemGroup, "items" | "userSettingPresentation"> & {
  items?: FilterItemComparisonReference[]
  userSettingPresentation?: FilterItemGroup["userSettingPresentation"] | string
}

describe("export FilterItem to XML", () => {
  it("exports FilterItemComparison to XML", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: [fullFilterItemComparison],
      xmlRootTag: "dcsset:item",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("restores implicit Equal comparisonType to XML", () => {
    const { result } = testExportPropertyToXML({
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
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: [inListFilterItemComparison],
      xmlRootTag: "dcsset:item",
      path: "inList.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports FilterItemComparison InList with xsi:nil to XML", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: [inListWithNilFilterItemComparison],
      referenceMetadata: [inListWithNilFilterItemComparison],
      xmlRootTag: "dcsset:item",
      path: "inListWithNil.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports FilterItemGroup to XML", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: [fullFilterItemGroup],
      xmlRootTag: "dcsset:item",
      path: "full-group.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  describe("semantic reference matching", () => {
    const guidA = "aaaaaaaa-0000-0000-0000-000000000001"
    const guidB = "bbbbbbbb-0000-0000-0000-000000000002"

    const asReferenceUserSettingID = (value: string): FilterItemComparison["userSettingID"] =>
      value as unknown as FilterItemComparison["userSettingID"]
    const asGroupReferenceUserSettingID = (value: string): FilterItemGroup["userSettingID"] =>
      value as unknown as FilterItemGroup["userSettingID"]

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

    const refA: FilterItemComparison = { ...itemA, userSettingID: asReferenceUserSettingID(guidA) }
    const refB: FilterItemComparison = { ...itemB, userSettingID: asReferenceUserSettingID(guidB) }

    it("FilterItemComparison: сопоставляет по leftValue+comparisonType, а не по индексу", () => {
      // current: [A, B], reference: [B, A] — порядок обратный
      const { result } = testExportPropertyToXML({
        rule,
        value: [itemA, itemB],
        xmlRootTag: "dcsset:item",
        referenceMetadata: [refB, refA],
      })

      // A должен получить GUID-A и идти раньше B с GUID-B
      expect(result).toContain(guidA)
      expect(result).toContain(guidB)
      expect(result.indexOf(guidA)).toBeLessThan(result.indexOf(guidB))
    })

    it("FilterItemComparison: элемент без совпадения в референсе не получает GUID", () => {
      // reference содержит только B
      const { result } = testExportPropertyToXML({
        rule,
        value: [itemA, itemB],
        xmlRootTag: "dcsset:item",
        referenceMetadata: [refB],
      })

      expect(result).not.toContain(guidA)
      expect(result).toContain(guidB)
    })

    it("FilterItemGroup: сопоставляет по groupType", () => {
      const guidOrGroup = "cccccccc-0000-0000-0000-000000000003"
      const guidAndGroup = "dddddddd-0000-0000-0000-000000000004"

      const orGroup: FilterItemGroup = { itemType: "FilterItemGroup", groupType: "OrGroup", userSettingID: true }
      const andGroup: FilterItemGroup = { itemType: "FilterItemGroup", groupType: "AndGroup", userSettingID: true }
      const refOr: FilterItemGroup = { ...orGroup, userSettingID: asGroupReferenceUserSettingID(guidOrGroup) }
      const refAnd: FilterItemGroup = { ...andGroup, userSettingID: asGroupReferenceUserSettingID(guidAndGroup) }

      // current: [OrGroup, AndGroup], reference: [AndGroup, OrGroup]
      const { result } = testExportPropertyToXML({
        rule,
        value: [orGroup, andGroup],
        xmlRootTag: "dcsset:item",
        referenceMetadata: [refAnd, refOr],
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

      const firstReference: FilterItemComparison = {
        ...current,
        rightValue: { type: "string", value: "Наличные" },
        userSettingID: asReferenceUserSettingID(guidA),
      }
      const secondReference: FilterItemComparison = {
        ...current,
        rightValue: { type: "string", value: "Безналичные" },
        userSettingID: asReferenceUserSettingID(guidB),
      }

      const { result } = testExportPropertyToXML({
        rule,
        value: [current],
        xmlRootTag: "dcsset:item",
        referenceMetadata: [firstReference, secondReference],
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
      const reference: FilterItemComparisonReference = {
        ...current,
        userSettingID: asReferenceUserSettingID(guid),
        userSettingPresentation: "Способ оплаты",
      }

      const { result } = testExportPropertyToXML({
        rule,
        value: [current],
        xmlRootTag: "dcsset:item",
        referenceMetadata: [reference],
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
      const reference: FilterItemComparisonReference = {
        ...current,
        leftValue: { type: "Field", value: "ТипОплаты" },
        comparisonType: "Equal",
        userSettingID: asReferenceUserSettingID(guid),
        userSettingPresentation: "Способ оплаты",
      }

      const { result } = testExportPropertyToXML({
        rule,
        value: [current],
        xmlRootTag: "dcsset:item",
        referenceMetadata: [reference],
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
      const referenceNested: FilterItemComparisonReference = {
        ...currentNested,
        userSettingID: asReferenceUserSettingID(guid),
        userSettingPresentation: "Контрагент",
      }
      const currentGroup: FilterItemGroup = {
        itemType: "FilterItemGroup",
        groupType: "AndGroup",
        items: [currentNested],
      }
      const referenceGroup: FilterItemGroupReference = {
        itemType: "FilterItemGroup",
        groupType: "AndGroup",
        items: [referenceNested],
      }

      const { result } = testExportPropertyToXML({
        rule,
        value: [currentGroup],
        xmlRootTag: "dcsset:item",
        referenceMetadata: [referenceGroup],
      })

      expect(result).toContain(`<dcsset:userSettingID>${guid}</dcsset:userSettingID>`)
      expect(result).toContain(
        `<dcsset:userSettingPresentation xsi:type="xs:string">Контрагент</dcsset:userSettingPresentation>`
      )
    })
  })
})
