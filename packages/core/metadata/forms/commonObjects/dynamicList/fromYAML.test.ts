import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  fullDynamicList,
  fullDynamicListYAML,
  keyFieldDynamicListYAML,
  queryTextWithManualQueryFalseDynamicListYAML,
} from "~/metadata/forms/commonObjects/dynamicList/__fixtures__/data"
import { importPropertyFromYAML, PropertyRule } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
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

  it("imports explicit ManualQuery true from YAML without query file", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        ПроизвольныйЗапрос: "Истина",
        ДинамическоеСчитываниеДанных: "Истина",
        ОсновнаяТаблица: "Catalog.РеестрПартийЗЕРНО",
      },
    })

    expect(result).toEqual({
      customQuery: true,
      dynamicDataRead: true,
      itemType: "DynamicList",
      mainTable: "Catalog.РеестрПартийЗЕРНО",
    })
  })

  it("does not derive ManualQuery from external query file", () => {
    const formDir = mkdtempSync(join(tmpdir(), "nkdk-dynamic-list-"))
    mkdirSync(join(formDir, "ДинамическийСписок"))
    writeFileSync(join(formDir, "ДинамическийСписок", "Список.query"), "ВЫБРАТЬ 1")

    const result = importPropertyFromYAML({
      context: {
        ...mockContext,
        importFromYAML: { formDir, parent: { name: "Список" } },
      },
      rule,
      value: {
        ДинамическоеСчитываниеДанных: "Истина",
        ОсновнаяТаблица: "Catalog.РеестрПартийЗЕРНО",
      },
      name: "Список",
    })

    expect(result).toEqual({
      customQuery: false,
      dynamicDataRead: true,
      itemType: "DynamicList",
      mainTable: "Catalog.РеестрПартийЗЕРНО",
      queryText: "ВЫБРАТЬ 1",
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
        ПроизвольныйЗапрос: "Истина",
        ДинамическоеСчитываниеДанных: "Ложь",
        ВидКлюча: "ЗначениеПоля",
        ПоляКлюча: "Ссылка",
      },
    })
  })

  it("imports ПоляКлюча array as keyFields array", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        ВидКлюча: "КлючСтроки",
        ПоляКлюча: ["КлючПриглашения", "Контрагент", "ИдентификаторОрганизации"],
      },
    })

    expect(result).toEqual({
      itemType: "DynamicList",
      customQuery: false,
      keyType: "RowKey",
      keyFields: ["КлючПриглашения", "Контрагент", "ИдентификаторОрганизации"],
    })
  })

  it("preserves calculated field Asc from raw XML source", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        ВычисляемыеПоля: [
          {
            ПутьКДанным: "УниверсальнаяДата",
            Выражение: "Дата",
            ВыраженияУпорядочивания: [
              {
                Выражение: "Дата",
                Автоупорядочивание: "Ложь",
              },
            ],
          },
        ],
      },
      sourceValue: {
        "_xsi:type": "DynamicList",
        CalculatedField: {
          "dcssch:dataPath": "УниверсальнаяДата",
          "dcssch:expression": "Дата",
          "dcssch:orderExpression": {
            expression: "Дата",
            orderType: {
              "#text": "Asc",
              _xmlns: "http://v8.1c.ru/8.1/data-composition-system/common",
            },
            autoOrder: false,
          },
        },
      },
    })

    expect(result).toMatchObject({
      itemType: "DynamicList",
      calculatedFields: [
        {
          itemType: "CalculatedField",
          dataPath: "УниверсальнаяДата",
          orderExpressions: [
            {
              itemType: "CalculatedFieldOrderExpression",
              expression: "Дата",
              orderType: "Asc",
              autoOrder: false,
            },
          ],
        },
      ],
    })
  })
})
