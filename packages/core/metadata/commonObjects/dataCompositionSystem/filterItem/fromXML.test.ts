import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import {
  fullFilterItemComparison,
  fullFilterItemGroup,
  inListFilterItemComparison,
  inListWithNilFilterItemComparison,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "FilterItem",
}

describe("import FilterItem from XML", () => {
  it("imports FilterItemComparison from XML", () => {
    const { comparisonType: _xmlDefault, ...expected } = fullFilterItemComparison
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual([expected])
  })

  it("preserves xs:string presentation as typed string", () => {
    const result = testImportPropertyFromXML({
      rule,
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

    expect(result).toEqual([
      {
        itemType: "FilterItemComparison",
        leftValue: { type: "Field", value: "Ссылка.Реквизит1" },
        rightValue: { type: "Field", value: "ПараметрыДанных.Параметр1" },
        presentation: { type: "string", value: "Английское" },
      },
    ])
  })

  it("imports FilterItemComparison InList (массив rightValue) from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "inList.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual([inListFilterItemComparison])
  })

  it("imports FilterItemComparison InList with xsi:nil from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "inListWithNil.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual([inListWithNilFilterItemComparison])
  })

  it("imports FilterItemGroup from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full-group.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual([fullFilterItemGroup])
  })
})
