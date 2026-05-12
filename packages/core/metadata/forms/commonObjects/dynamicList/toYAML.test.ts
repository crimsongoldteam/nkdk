import { describe, expect, it } from "vitest"
import {
  fullDynamicList,
  fullDynamicListYAML,
  keyFieldDynamicList,
  multipleCalculatedFieldsDynamicList,
  queryTextWithManualQueryFalseDynamicList,
  queryTextWithManualQueryFalseDynamicListYAML,
} from "~/metadata/forms/commonObjects/dynamicList/__fixtures__/data"
import { exportPropertyToYAML, PropertyRule } from "~/metadata/orchestration"
import { mockContextToTypedYAML } from "~/tests/mockContext"

const rule: PropertyRule = {
  type: "DynamicList",
  yaml: "ДинамическийСписок",
}

describe("export DynamicList to YAML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: undefined,
    })
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: fullDynamicList,
    })
    expect(result).toEqual({ ДинамическийСписок: fullDynamicListYAML })
  })

  it("exports explicit ManualQuery false when queryText is present", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: queryTextWithManualQueryFalseDynamicList,
    })

    expect(result).toEqual({ ДинамическийСписок: queryTextWithManualQueryFalseDynamicListYAML })
  })

  it("exports calculatedFields as YAML array", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: multipleCalculatedFieldsDynamicList,
    })

    expect(result?.ДинамическийСписок?.ВычисляемыеПоля).toEqual([
      {
        ПутьКДанным: "РабочееМесто",
        Выражение: "ФискальноеУстройство.РабочееМесто",
        Заголовок: "Рабочее место",
      },
      {
        ПутьКДанным: "ОбщееСостояниеПодключения",
        Выражение: "",
        Заголовок: "Настройки",
        Оформление: {
          ЦветТекста: "#1C55AE",
        },
      },
    ])
  })

  it("exports KeyType and KeyField", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: keyFieldDynamicList,
    })

    expect(result).toEqual({
      ДинамическийСписок: {
        ДинамическоеСчитываниеДанных: "Истина",
        ВидКлюча: "ЗначениеПоля",
        ПоляКлюча: "Ссылка",
      },
    })
  })

  it("does not export ManualQuery true when queryText is present and collects query file", () => {
    const externalFilesCollector: { relativePath: string; content: string }[] = []
    const queryText = "ВЫБРАТЬ\n  Справочник1.Ссылка\nИЗ\n  Справочник.Справочник1 КАК Справочник1"

    const result = exportPropertyToYAML({
      context: {
        ...mockContextToTypedYAML,
        exportToYAML: {
          ...mockContextToTypedYAML.exportToYAML!,
          externalFilesCollector,
        },
      },
      rule,
      value: {
        customQuery: true,
        dynamicDataRead: true,
        itemType: "DynamicList",
        mainTable: "Catalog.Справочник1",
        queryText,
      },
      name: "ПроизвольныйЗапросМинимум",
    })

    expect(result).toEqual({
      ДинамическийСписок: {
        ДинамическоеСчитываниеДанных: "Истина",
        ОсновнаяТаблица: "Catalog.Справочник1",
      },
    })
    expect(externalFilesCollector).toEqual([
      {
        relativePath: "ДинамическийСписок/ПроизвольныйЗапросМинимум.query",
        content: queryText,
      },
    ])
  })

  it("does not export ManualQuery false when queryText is absent", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: {
        customQuery: false,
        dynamicDataRead: true,
        itemType: "DynamicList",
        mainTable: "Catalog.РеестрПартийЗЕРНО",
      },
    })

    expect(result).toEqual({
      ДинамическийСписок: {
        ДинамическоеСчитываниеДанных: "Истина",
        ОсновнаяТаблица: "Catalog.РеестрПартийЗЕРНО",
      },
    })
  })
})
