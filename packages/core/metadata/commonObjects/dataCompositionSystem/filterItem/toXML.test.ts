import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
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

    const refA: FilterItemComparison = { ...itemA, userSettingID: guidA as any }
    const refB: FilterItemComparison = { ...itemB, userSettingID: guidB as any }

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
      const refOr: FilterItemGroup = { ...orGroup, userSettingID: guidOrGroup as any }
      const refAnd: FilterItemGroup = { ...andGroup, userSettingID: guidAndGroup as any }

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
  })
})
