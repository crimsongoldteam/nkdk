import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import {
  fullDCSParameters,
  fullDCSParametersYAML,
  minimalDCSParameters,
  minimalDCSParametersYAML,
} from "./__fixtures__/data"
import "./types"
import { explicitYAMLString } from "../../../../yaml/explicitString"

const rule: PropertyRule = {
  type: "DCSParameters",
  yaml: "Параметры",
}

const xmlWithStringTitle = `<Settings>
  <Parameter>
    <dcssch:name>StringTitleParameter</dcssch:name>
    <dcssch:title xsi:type="xs:string">String title</dcssch:title>
  </Parameter>
</Settings>`

const xmlWithUndefinedTypeValue = `<Settings>
  <Parameter>
    <dcssch:name>ТипЗначенияКлюча</dcssch:name>
    <dcssch:title xsi:type="v8:LocalStringType">
      <v8:item><v8:lang>ru</v8:lang><v8:content>Тип значения ключа</v8:content></v8:item>
    </dcssch:title>
    <dcssch:valueType><v8:Type>v8:Type</v8:Type></dcssch:valueType>
    <dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value>
    <dcssch:useRestriction>true</dcssch:useRestriction>
  </Parameter>
</Settings>`

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

  it("preserves xs:string title in YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: undefined,
      xmlRootTag: "Settings",
      xmlString: xmlWithStringTitle,
    })

    expect(result).toEqual({
      Параметры: {
        StringTitleParameter: {
          Заголовок: "String title",
        },
      },
    })
  })

  it("omits v8 Type Undefined value from YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: undefined,
      xmlRootTag: "Settings",
      xmlString: xmlWithUndefinedTypeValue,
    })

    expect(result).toEqual({
      Параметры: {
        ТипЗначенияКлюча: {
          Заголовок: "Тип значения ключа",
          ТипЗначения: "Тип",
          ОграничениеИспользования: "Истина",
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
