import { describe, expect, it } from "vitest"
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
  treeWithColumnFormAttribute,
  treeWithColumnFormAttributeYAML,
  withAdditionalColumnFormAttribute,
  withAdditionalColumnFormAttributeYAML,
  withEmptySettingsFormAttribute,
  withEmptySettingsFormAttributeYAML,
  withFunctionalOptionsFormAttribute,
  withFunctionalOptionsFormAttributeYAML,
} from "~/tests/fixtures/formAttributes/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { chartSettings } from "./__fixtures__/chartSettings"
import { spreadsheetDocumentSettings } from "./__fixtures__/spreadsheetDocumentSettings"
import { importFormAttributesFromYAML } from "./fromYAML"

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

describe("importFormAttributesFromYAML", () => {
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

  it("should import with short format", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, shortFormAttributeYAML)

    expect(result).toEqual(shortFormAttribute)
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

    expect(result).toEqual(treeWithColumnFormAttribute)
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
})
