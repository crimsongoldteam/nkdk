import { describe, expect, it } from "vitest"
import {
  fullDynamicList,
  fullDynamicListYAML,
  keyFieldDynamicListYAML,
  queryTextWithManualQueryFalseDynamicListYAML,
} from "~/metadata/forms/commonObjects/dynamicList/__fixtures__/data"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"

const rule: PropertyRule = {
  type: "DynamicList",
  yaml: "ДинамическийСписок",
}

describe("import DynamicList from YAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: undefined,
    })
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fullDynamicListYAML,
    })
    expect(result).toEqual(fullDynamicList)
  })

  it("round-trip: import → export даёт тот же YAML", () => {
    const imported = testImportPropertyFromYAML({
      rule,
      value: fullDynamicListYAML,
    })
    const exported = testExportPropertyToYAML({
      rule,
      value: imported,
    })
    expect(exported).toEqual({ ДинамическийСписок: fullDynamicListYAML })
  })

  it("imports explicit ManualQuery false from YAML even when queryText exists in model fixture", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: queryTextWithManualQueryFalseDynamicListYAML,
    })

    expect(result).toEqual({
      customQuery: false,
      dynamicDataRead: true,
      itemType: "DynamicList",
      mainTable: "Catalog.РеестрПартийЗЕРНО",
    })
  })

  it("imports KeyType and KeyField", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: keyFieldDynamicListYAML,
    })

    expect(result).toEqual({
      itemType: "DynamicList",
      customQuery: true,
      dynamicDataRead: false,
      keyType: "FieldValue",
      keyFields: "Ссылка",
    })
  })

  it("round-trip: KeyType and KeyField YAML import -> export", () => {
    const imported = testImportPropertyFromYAML({
      rule,
      value: keyFieldDynamicListYAML,
    })
    const exported = testExportPropertyToYAML({
      rule,
      value: imported,
    })

    expect(exported).toEqual({
      ДинамическийСписок: {
        ДинамическоеСчитываниеДанных: "Ложь",
        ВидКлюча: "ЗначениеПоля",
        ПоляКлюча: "Ссылка",
      },
    })
  })
})
