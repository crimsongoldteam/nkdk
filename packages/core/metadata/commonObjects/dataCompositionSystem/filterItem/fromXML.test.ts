import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../../tests/readAndParseXMLFile"
import { testFixturesDir } from "../../../../tests/testFixturesDir"
import { createLocalIndexesCollector } from "../../../project/localIndexes"
import { getTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import {
  fullFilterItemComparison,
  fullFilterItemGroup,
  inListFilterItemComparison,
  inListWithNilFilterItemComparison,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "FilterItem",
  yaml: "Элементы",
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

  it("imports FilterItemComparison directly to YAML", () => {
    const direct = getTypeRule("FilterItem", "importFromXMLToYAML")
    if (direct === undefined) throw new Error("FilterItem direct converter is not registered")
    const fixtureXML = readAndParseXMLFile<Record<string, unknown>>("full.xml", testFixturesDir(import.meta.url))["dcsset:item"]

    expect(
      direct({
        context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
        rule,
        xml: fixtureXML,
        traversal: {
          yamlPath: ["Элементы"],
          rulePath: [{ propertyKey: "items" }],
          collector: createLocalIndexesCollector(),
        },
      })
    ).toEqual([
      {
        Использование: "Ложь",
        ЛевоеЗначение: ".Ссылка",
        ПравоеЗначение: "Справочник.Справочник1.ПустаяСсылка",
        Представление: {
          Тип: "МногоязычнаяСтрока",
          Значение: "Представление",
        },
        ПредставлениеПользовательскойНастройки: "Пользовательское представление",
        РежимОтображения: "Обычный",
        ИспользоватьПользовательскуюНастройку: "7b8eb4d9-8661-46f5-9da8-dbe4d77a2292",
      },
    ])
  })
})
