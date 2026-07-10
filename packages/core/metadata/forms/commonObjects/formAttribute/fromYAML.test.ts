import { beforeAll, describe, expect, it } from "vitest"
import {
  choiceListFormAttribute,
  choiceListFormAttributeYAML,
  fullFormAttributes,
  fullFormAttributesYAML,
  mainAttributeTitleEqualsName,
  mainAttributeTitleEqualsNameYAML,
  minimalFormAttributes,
  minimalFormAttributesYAML,
  mixedColumnsFormAttribute,
  mixedColumnsFormAttributeYAML,
  shortFormAttribute,
  shortFormAttributeYAML,
  tableWithColumnsFormAttribute,
  tableWithColumnsFormAttributeYAML,
  treeWithColumnFormAttributeYAML,
  withAdditionalColumnFormAttribute,
  withAdditionalColumnFormAttributeYAML,
  withEmptySettingsFormAttribute,
  withEmptySettingsFormAttributeYAML,
  withFunctionalOptionsFormAttribute,
  withFunctionalOptionsFormAttributeYAML,
} from "./__fixtures__/legacy/data"
import { mockContext, mockRule } from "../../../../tests/mockContext"
import { chartSettings } from "./__fixtures__/chartSettings"
import { plannerSettings } from "./__fixtures__/plannerSettings"
import { spreadsheetDocumentSettings } from "./__fixtures__/spreadsheetDocumentSettings"
import { importFormAttributesFromYAML } from "./fromYAML"
import { exportFormAttributesToJSONSchema } from "./toJSONSchema"

const treeWithColumnFormAttributeFromYAML = [
  {
    name: "Дерево",
    title: { items: { ru: "" } },
    type: { type: ["ValueTree"] },
    columns: [
      {
        name: "Колонка1",
        title: { items: { ru: "abc" } },
        type: { type: ["string"] },
        view: { common: false, values: [] },
        edit: { common: false, values: [] },
        fillCheck: "ShowError",
        itemType: "FormAttributeColumn",
      },
    ],
    fieldsList: ["Дерево.Колонка1"],
    itemType: "FormAttribute",
  },
]

const chartSettingsYAML = {
  Диаграмма: {
    Тип: "Диаграмма",
    Заголовок: "",
    Диаграмма: `<d4p1:seriesCurId>1</d4p1:seriesCurId>
<d4p1:pointsCurId>0</d4p1:pointsCurId>
<d4p1:realExSeriesData>
	<d4p1:id>1</d4p1:id>
	<d4p1:color>auto</d4p1:color>
	<d4p1:line width="2" gap="false">
		<v8ui:style xsi:type="v8ui:ChartLineType">Solid</v8ui:style>
	</d4p1:line>
	<d4p1:text/>
</d4p1:realExSeriesData>
<d4p1:valuesAxis/>
<d4p1:pointsAxis/>`,
  },
}

const spreadsheetDocumentSettingsYAML = {
  Макет: {
    Тип: "ТабличныйДокумент",
    Заголовок: "",
    ТабличныйДокумент: `<mxl:languageSettings>
	<mxl:currentLanguage/>
	<mxl:defaultLanguage/>
</mxl:languageSettings>
<mxl:columns>
	<mxl:size>3</mxl:size>
</mxl:columns>
<mxl:rowsItem>
	<mxl:index>0</mxl:index>
	<mxl:row>
		<mxl:empty>true</mxl:empty>
	</mxl:row>
</mxl:rowsItem>
<mxl:format>
	<mxl:width>72</mxl:width>
</mxl:format>`,
  },
}

const plannerSettingsYAML = {
  Канбан: {
    Тип: "Планировщик",
    Заголовок: "",
    Планировщик: `<pl:itemsCurId>1</pl:itemsCurId>
<pl:periodsCurId>2</pl:periodsCurId>
<pl:resourcesCurId>3</pl:resourcesCurId>`,
  },
}

let formAttributesJSONSchemaCache: string | undefined

const formAttributesJSONSchema = () => {
  if (formAttributesJSONSchemaCache !== undefined) return formAttributesJSONSchemaCache

  const formAttributesSchema = exportFormAttributesToJSONSchema({
    context: mockContext,
    rule: { type: "FormAttributes" },
    value: undefined,
  })
  if (formAttributesSchema === undefined) throw new Error("FormAttributes JSON schema is not registered")
  formAttributesJSONSchemaCache = JSON.stringify(formAttributesSchema)
  return formAttributesJSONSchemaCache
}

describe("importFormAttributesFromYAML", () => {
  beforeAll(() => {
    formAttributesJSONSchema()
  }, 30_000)

  it("should return undefined when data is undefined", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, fullFormAttributesYAML)

    expect(result).toEqual(fullFormAttributes)
  })

  it("should import minimal", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, minimalFormAttributesYAML)

    expect(result).toEqual(minimalFormAttributes)
  })

  it("should import object format", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, shortFormAttributeYAML)

    expect(result).toEqual(shortFormAttribute)
  })

  it("exports object form attribute YAML in JSON Schema", () => {
    const json = formAttributesJSONSchema()

    expect(json).toContain('"Тип"')
    expect(json).toContain('"type":"object"')
  })

  it("exports table columns in JSON Schema", () => {
    const json = formAttributesJSONSchema()

    expect(json).toContain('"Колонки"')
    expect(json).toContain('"Заголовок"')
  })

  it("exports additional table columns in JSON Schema", () => {
    const json = formAttributesJSONSchema()

    expect(json).toContain('"ДополнительныеКолонки"')
  })

  it("exports strict table column objects in JSON Schema", () => {
    const json = formAttributesJSONSchema()

    expect(json).toContain('"additionalProperties":false')
  })

  it("exports spreadsheet document settings in JSON Schema", () => {
    const json = formAttributesJSONSchema()

    expect(json).toContain('"ТабличныйДокумент"')
  })

  it("exports chart settings in JSON Schema", () => {
    const json = formAttributesJSONSchema()

    expect(json).toContain('"Диаграмма"')
  })

  it("exports gantt chart settings in JSON Schema", () => {
    const json = formAttributesJSONSchema()

    expect(json).toContain('"ДиаграммаГанта"')
  })

  it("exports flowchart context settings in JSON Schema", () => {
    const json = formAttributesJSONSchema()

    expect(json).toContain('"ГрафическаяСхема"')
  })

  it("exports planner settings in JSON Schema", () => {
    const json = formAttributesJSONSchema()

    expect(json).toContain('"Планировщик"')
  })

  it("exports string spreadsheet document settings in JSON Schema", () => {
    const json = formAttributesJSONSchema()

    expect(json).toContain('"type":"string"')
  })

  it("should import title when mainAttribute=true and title equals name", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, mainAttributeTitleEqualsNameYAML)

    expect(result).toEqual(mainAttributeTitleEqualsName)
  })

  it("should import choice list", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, choiceListFormAttributeYAML)

    expect(result).toEqual(choiceListFormAttribute)
  })

  it("should import with empty settings", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, withEmptySettingsFormAttributeYAML)

    expect(result).toEqual(withEmptySettingsFormAttribute)
  })

  // it("should import with dynamic list", () => {
  //   const result = importFormAttributesFromYAML(mockContext, mockRule, withDynamicListFormAttributeYAML)

  //   expect(result).toEqual(withDynamicListFormAttribute)
  // })

  it("should import table with columns", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, tableWithColumnsFormAttributeYAML)

    expect(result).toEqual(tableWithColumnsFormAttribute)
  })

  it("should import tree with column", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, treeWithColumnFormAttributeYAML)

    expect(result).toEqual(treeWithColumnFormAttributeFromYAML)
  })

  it("should import with functional options", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, withFunctionalOptionsFormAttributeYAML)

    expect(result).toEqual(withFunctionalOptionsFormAttribute)
  })

  it("should import with additional column", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, withAdditionalColumnFormAttributeYAML)

    expect(result).toEqual(withAdditionalColumnFormAttribute)
  })

  it("should import mixed columns", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, mixedColumnsFormAttributeYAML)

    expect(result).toEqual(mixedColumnsFormAttribute)
  })

  it("should import chartSettings", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, chartSettingsYAML)

    expect(result).toEqual(chartSettings)
  })

  it("should import spreadsheetDocumentSettings", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, spreadsheetDocumentSettingsYAML)

    expect(result).toEqual(spreadsheetDocumentSettings)
  })

  it("should import plannerSettings", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, plannerSettingsYAML)

    expect(result).toEqual(plannerSettings)
  })

  it("should preserve title languages from source when default language is absent", () => {
    const result = importFormAttributesFromYAML(
      mockContext,
      mockRule,
      {
        ОценкаОтправлена: {
          Заголовок: { en: "Оценка отправлена" },
          Тип: "Булево",
        },
      },
      [
        {
          name: "ОценкаОтправлена",
          title: { items: { en: "Оценка отправлена" } },
          type: { type: ["boolean"] },
          itemType: "FormAttribute",
          columns: [],
        },
      ]
    )

    expect(result?.[0]?.title).toEqual({
      items: {
        en: "Оценка отправлена",
      },
    })
  })

  it("should preserve column title languages from source when default language is absent", () => {
    const result = importFormAttributesFromYAML(
      mockContext,
      mockRule,
      {
        Таблица: {
          Заголовок: "",
          Тип: "ТаблицаЗначений",
          Колонки: {
            Колонка: {
              Заголовок: { en: "Column sent" },
              Тип: "Строка",
            },
          },
        },
      },
      [
        {
          name: "Таблица",
          title: { items: { ru: "" } },
          type: { type: ["ValueTable"] },
          itemType: "FormAttribute",
          columns: [
            {
              name: "Колонка",
              title: { items: { en: "Column sent" } },
              type: { type: ["string"] },
              itemType: "FormAttributeColumn",
            },
          ],
        },
      ]
    )

    expect(result?.[0]?.columns?.[0]?.title).toEqual({
      items: {
        en: "Column sent",
      },
    })
  })

  it("should preserve additional column title languages from source when default language is absent", () => {
    const result = importFormAttributesFromYAML(
      mockContext,
      mockRule,
      {
        Таблица: {
          Заголовок: "",
          Тип: "ТаблицаЗначений",
          ДополнительныеКолонки: {
            "Объект.Таблица": {
              Колонка: {
                Заголовок: { en: "Column sent" },
                Тип: "Строка",
              },
            },
          },
        },
      },
      [
        {
          name: "Таблица",
          title: { items: { ru: "" } },
          type: { type: ["ValueTable"] },
          itemType: "FormAttribute",
          columns: [],
          additionalColumns: [
            {
              table: "Объект.Таблица",
              columns: [
                {
                  name: "Колонка",
                  title: { items: { en: "Column sent" } },
                  type: { type: ["string"] },
                  itemType: "FormAttributeColumn",
                },
              ],
            },
          ],
        },
      ]
    )

    expect(result?.[0]?.additionalColumns?.[0]?.columns[0]?.title).toEqual({
      items: {
        en: "Column sent",
      },
    })
  })
})
