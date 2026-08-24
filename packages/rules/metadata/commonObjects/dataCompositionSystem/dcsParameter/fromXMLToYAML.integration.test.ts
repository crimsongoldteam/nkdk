import { explicitYAMLString } from "@nkdk/runtime"
import { describe,expect,it } from "vitest"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import { PropertyRule } from "../../../ruleRuntime"
import {
fullDCSParameters,
fullDCSParametersYAML,
minimalDCSParameters,
minimalDCSParametersYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "DCSParameters",
  yaml: "Параметры",
}

const xmlWithAccumulationRecordTypeValue = `<Settings>
  <Parameter>
    <dcssch:name>ВидДвижения</dcssch:name>
    <dcssch:valueType><v8:Type>ent:AccumulationRecordType</v8:Type></dcssch:valueType>
    <dcssch:value xsi:type="ent:AccumulationRecordType">Expense</dcssch:value>
    <dcssch:useRestriction>true</dcssch:useRestriction>
  </Parameter>
</Settings>`

describe("export DCSParameter to YAML", () => {

  it("exports undefined", () => {
    const result = testExportPropertyModelThroughXMLToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("exports minimal collection", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: minimalDCSParameters,
      path: "minimal.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual({ Параметры: minimalDCSParametersYAML })
  })

  it("exports full collection", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: fullDCSParameters,
      path: "full.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual({ Параметры: fullDCSParametersYAML })
  })

  it("exports multiple values", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: [
        {
          itemType: "DCSParameter" as const,
          name: "ТипыНалогообложения",
          value: [
            {
              type: "DesignTimeValue" as const,
              value: "Перечисление.ТипыНалогообложенияНДС.ПродажаНаЭкспорт",
            },
            {
              type: "DesignTimeValue" as const,
              value: "Перечисление.ТипыНалогообложенияНДС.ЭкспортСырьевыхТоваровУслуг",
            },
          ],
        },
      ],
      yaml: {
        ТипыНалогообложения: {
          Значение: [
            "Перечисление.ТипыНалогообложенияНДС.ПродажаНаЭкспорт",
            "Перечисление.ТипыНалогообложенияНДС.ЭкспортСырьевыхТоваровУслуг",
          ],
        },
      },
    })

    expect(result).toEqual({
      Параметры: {
        ТипыНалогообложения: {
          Значение: [
            "Перечисление.ТипыНалогообложенияНДС.ПродажаНаЭкспорт",
            "Перечисление.ТипыНалогообложенияНДС.ЭкспортСырьевыхТоваровУслуг",
          ],
        },
      },
    })
  })

  it("exports inferred system enumeration to YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: undefined,
      xmlRootTag: "Settings",
      xmlString: xmlWithAccumulationRecordTypeValue,
    })

    expect(result).toEqual({
      Параметры: {
        ВидДвижения: {
          ТипЗначения: "ВидДвиженияНакопления",
          Значение: {
            Тип: "СистемноеПеречисление",
            Имя: "AccumulationRecordType",
            Значение: "Расход",
          },
          ОграничениеИспользования: "Истина",
        },
      },
    })
  })

  it("preserves numeric-looking edit parameter mask as a string", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: undefined,
      xmlRootTag: "Settings",
      xmlString: `<Settings>
        <Parameter>
          <dcssch:name>Параметр1</dcssch:name>
          <dcssch:inputParameters>
            <dcscor:item>
              <dcscor:parameter>Маска</dcscor:parameter>
              <dcscor:value xsi:type="xs:string">123</dcscor:value>
            </dcscor:item>
          </dcssch:inputParameters>
        </Parameter>
      </Settings>`,
    })

    expect(result).toEqual({
      Параметры: {
        Параметр1: {
          ПараметрыРедактирования: {
            Маска: { Значение: explicitYAMLString("123") },
          },
        },
      },
    })
  })
})
