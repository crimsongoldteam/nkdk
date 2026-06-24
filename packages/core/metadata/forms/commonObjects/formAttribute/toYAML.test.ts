import { beforeEach, describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  choiceListFormAttribute,
  choiceListFormAttributeYAML,
  fullFormAttributes,
  fullFormAttributesYAML,
  mixedColumnsFormAttribute,
  mixedColumnsFormAttributeYAML,
  shortFormAttribute,
  shortFormAttributeYAML,
  tableWithColumnsFormAttribute,
  tableWithColumnsFormAttributeYAML,
  treeWithColumnFormAttribute,
  treeWithColumnFormAttributeYAML,
  withAdditionalColumnFormAttribute,
  withAdditionalColumnFormAttributeYAML,
  withEmptySettingsFormAttribute,
  withEmptySettingsFormAttributeYAML,
  withFunctionalOptionsFormAttribute,
  withFunctionalOptionsFormAttributeYAML,
} from "~/metadata/forms/commonObjects/formAttribute/__fixtures__/legacy/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { chartSettings } from "./__fixtures__/chartSettings"
import { plannerSettings } from "./__fixtures__/plannerSettings"
import { spreadsheetDocumentSettings } from "./__fixtures__/spreadsheetDocumentSettings"
import { exportFormAttributesToYAML } from "./toYAML"

let context: ConfigurationContext

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

describe("exportFormAttributesToYAML", () => {
  beforeEach(() => {
    context = {
      ...mockContext,
      exportToYAML: {
        toTyped: false,
      },
    }
  })
  it("should export undefined when data is undefined", () => {
    const result = exportFormAttributesToYAML(context, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportFormAttributesToYAML(context, mockRule, fullFormAttributes)

    expect(result).toEqual(fullFormAttributesYAML)
  })

  it("should export object format", () => {
    const result = exportFormAttributesToYAML(context, mockRule, shortFormAttribute)

    expect(result).toEqual(shortFormAttributeYAML)
  })

  // it("should export title when mainAttribute=true and title equals name", () => {
  //   const result = exportFormAttributesToYAML(context, mockRule, mainAttributeTitleEqualsName)

  //   expect(result).toEqual(mainAttributeTitleEqualsNameYAML)
  // })

  it("should export choice list", () => {
    const result = exportFormAttributesToYAML(context, mockRule, choiceListFormAttribute)

    expect(result).toEqual(choiceListFormAttributeYAML)
  })

  it("should export with empty settings", () => {
    const result = exportFormAttributesToYAML(context, mockRule, withEmptySettingsFormAttribute)

    expect(result).toEqual(withEmptySettingsFormAttributeYAML)
  })

  // it("should export with dynamic list", () => {
  //   const result = exportFormAttributesToYAML(context, mockRule, withDynamicListFormAttribute)

  //   expect(result).toEqual(withDynamicListFormAttributeYAML)
  // })

  it("should export table with columns", () => {
    const result = exportFormAttributesToYAML(context, mockRule, tableWithColumnsFormAttribute)

    expect(result).toEqual(tableWithColumnsFormAttributeYAML)
  })

  it("should export tree with column", () => {
    const result = exportFormAttributesToYAML(context, mockRule, treeWithColumnFormAttribute)

    expect(result).toEqual(treeWithColumnFormAttributeYAML)
  })

  it("should export with functional options", () => {
    const result = exportFormAttributesToYAML(context, mockRule, withFunctionalOptionsFormAttribute)

    expect(result).toEqual(withFunctionalOptionsFormAttributeYAML)
  })

  it("should export with additional column", () => {
    const result = exportFormAttributesToYAML(context, mockRule, withAdditionalColumnFormAttribute)

    expect(result).toEqual(withAdditionalColumnFormAttributeYAML)
  })

  it("should export mixed columns", () => {
    const result = exportFormAttributesToYAML(context, mockRule, mixedColumnsFormAttribute)

    expect(result).toEqual(mixedColumnsFormAttributeYAML)
  })

  it("should export chartSettings", () => {
    const result = exportFormAttributesToYAML(context, mockRule, chartSettings)

    expect(result).toEqual(chartSettingsYAML)
  })

  it("should export spreadsheetDocumentSettings", () => {
    const result = exportFormAttributesToYAML(context, mockRule, spreadsheetDocumentSettings)

    expect(result).toEqual(spreadsheetDocumentSettingsYAML)
  })

  it("should export plannerSettings", () => {
    const result = exportFormAttributesToYAML(context, mockRule, plannerSettings)

    expect(result).toEqual(plannerSettingsYAML)
  })
})
