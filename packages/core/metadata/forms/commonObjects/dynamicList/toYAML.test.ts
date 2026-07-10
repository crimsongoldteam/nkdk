import { describe, expect, it } from "vitest"
import {
  fullDynamicList,
  fullDynamicListYAML,
  keyFieldDynamicList,
  multipleCalculatedFieldsDynamicList,
  queryTextWithManualQueryFalseDynamicList,
  queryTextWithManualQueryFalseDynamicListYAML,
  queryTextWithManualQueryFalseText,
} from "./__fixtures__/data"
import { exportPropertyToYAML, PropertyRule } from "../../../orchestration"
import { mockContextToTypedYAML } from "../../../../tests/mockContext"

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
    expect(result).toEqual({
      ДинамическийСписок: fullDynamicListYAML,
    })
  })

  it("omits ManualQuery false when queryText is present", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: queryTextWithManualQueryFalseDynamicList,
    })

    const { ДинамическоеСчитываниеДанных, ПроизвольныйЗапрос, ...expectedYAML } =
      queryTextWithManualQueryFalseDynamicListYAML
    expect(ДинамическоеСчитываниеДанных).toBe("Истина")
    expect(ПроизвольныйЗапрос).toBe("Ложь")
    expect(result).toEqual({ ДинамическийСписок: expectedYAML })
  })

  it("exports explicit ManualQuery true when queryText is present", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: {
        customQuery: true,
        dynamicDataRead: true,
        itemType: "DynamicList",
        queryText: queryTextWithManualQueryFalseText,
        mainTable: "Catalog.РеестрПартийЗЕРНО",
      },
    })

    expect(result).toEqual({
      ДинамическийСписок: {
        ПроизвольныйЗапрос: "Истина",
        ОсновнаяТаблица: "Catalog.РеестрПартийЗЕРНО",
      },
    })
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
          ЦветТекста: {
            Значение: "#1C55AE",
          },
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
        ПроизвольныйЗапрос: "Истина",
        ВидКлюча: "ЗначениеПоля",
        ПоляКлюча: "Ссылка",
      },
    })
  })

  it("exports keyFields array as ПоляКлюча array", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: {
        itemType: "DynamicList",
        keyType: "RowKey",
        keyFields: ["КлючПриглашения", "Контрагент", "ИдентификаторОрганизации"],
      },
    })

    expect(result).toEqual({
      ДинамическийСписок: {
        ВидКлюча: "КлючСтроки",
        ПоляКлюча: ["КлючПриглашения", "Контрагент", "ИдентификаторОрганизации"],
      },
    })
  })

  it("exports ManualQuery true when queryText is present and collects query file", () => {
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
        ПроизвольныйЗапрос: "Истина",
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

  it("omits ManualQuery false because it is YAML default", () => {
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
        ОсновнаяТаблица: "Catalog.РеестрПартийЗЕРНО",
      },
    })
  })

  it("does not emit ManualQuery false when queryText is present", () => {
    const externalFilesCollector: { relativePath: string; content: string }[] = []
    const queryText = "ВЫБРАТЬ 1"

    const result = exportPropertyToYAML({
      context: {
        ...mockContextToTypedYAML,
        exportToYAML: {
          ...mockContextToTypedYAML.exportToYAML!,
          externalFilesCollector,
          parent: { name: "Список" },
        },
      },
      rule,
      value: {
        customQuery: false,
        itemType: "DynamicList",
        queryText,
      },
      name: "Список",
    })

    expect(result).toBeUndefined()
    expect(externalFilesCollector).toEqual([
      {
        relativePath: "ДинамическийСписок/Список.query",
        content: queryText,
      },
    ])
  })
})
