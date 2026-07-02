import { describe, expect, it } from "vitest"
import { exportPropertyToXML, exportPropertyToYAML, importPropertyFromYAML, PropertyRule } from "../../../orchestration"
import { mockContext } from "../../../../tests/mockContext"
import { mockContextToXML } from "../../../../tests/mockContext"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { exportToYAML } from "../../../../yaml/export"
import { importFromYAML } from "../../../../yaml/import"
import { xmlExport } from "../../../../xml/export/exporter"
import { fullDCSParameters, minimalDCSParameters } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = { type: "DCSParameters" }
const yamlRule: PropertyRule = { type: "DCSParameters", yaml: "Параметры" }

const xmlWithStringTitle = `<Settings>
	<Parameter>
		<dcssch:name>StringTitleParameter</dcssch:name>
		<dcssch:title xsi:type="xs:string">String title</dcssch:title>
	</Parameter>
</Settings>`

const undefinedTypeReferenceValue = {
  "_xmlns:d6p1": "http://v8.1c.ru/8.2/data/types",
  "_xsi:type": "v8:Type",
  "#text": "d6p1:Undefined",
} as const

const xmlWithUndefinedTypeValue = `<Settings>
	<Parameter>
		<dcssch:name>ТипЗначенияКлюча</dcssch:name>
		<dcssch:title xsi:type="v8:LocalStringType">
			<v8:item>
				<v8:lang>ru</v8:lang>
				<v8:content>Тип значения ключа</v8:content>
			</v8:item>
		</dcssch:title>
		<dcssch:valueType>
			<v8:Type>v8:Type</v8:Type>
		</dcssch:valueType>
		<dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value>
		<dcssch:useRestriction>true</dcssch:useRestriction>
	</Parameter>
</Settings>`

const xmlWithMultipleValues = `<Settings>
	<Parameter>
		<dcssch:name>ТипыНалогообложения</dcssch:name>
		<dcssch:value xsi:type="dcscor:DesignTimeValue">Перечисление.ТипыНалогообложенияНДС.ПродажаНаЭкспорт</dcssch:value>
		<dcssch:value xsi:type="dcscor:DesignTimeValue">Перечисление.ТипыНалогообложенияНДС.ЭкспортСырьевыхТоваровУслуг</dcssch:value>
	</Parameter>
</Settings>`

const xmlWithAccumulationRecordTypeValue = `<Settings>
	<Parameter>
		<dcssch:name>ВидДвижения</dcssch:name>
		<dcssch:valueType>
			<v8:Type>ent:AccumulationRecordType</v8:Type>
		</dcssch:valueType>
		<dcssch:value xsi:type="ent:AccumulationRecordType">Expense</dcssch:value>
		<dcssch:useRestriction>true</dcssch:useRestriction>
	</Parameter>
</Settings>`

const exportDCSParameters = (value: unknown, referenceMetadata?: unknown): string => {
  const xmlData = exportPropertyToXML({
    context: mockContextToXML(),
    rule,
    value,
    referenceMetadata,
  })

  return xmlExport({ Settings: xmlData }, false)
}

describe("import DCSParameter from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      importMetaUrl: import.meta.url,
      xmlRootTag: "Settings",
    })
    expect(result).toEqual(fullDCSParameters)
  })

  it("imports minimal.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
      xmlRootTag: "Settings",
    })
    expect(result).toEqual(minimalDCSParameters)
  })

  it("imports and exports xs:string title", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: xmlWithStringTitle,
      xmlRootTag: "Settings",
    })
    const referenceMetadata = testImportPropertyFromXML({
      rule,
      xmlString: xmlWithStringTitle,
      xmlRootTag: "Settings",
      forReference: true,
    })

    expect(result).toEqual([
      {
        itemType: "DCSParameter",
        name: "StringTitleParameter",
        title: { items: { ru: "String title" } },
      },
    ])

    const exported = exportDCSParameters(result, referenceMetadata)
    expect(exported).toContain(`<dcssch:title xsi:type="xs:string">String title</dcssch:title>`)
    expect(exported).not.toContain(`<dcssch:title xsi:type="v8:LocalStringType">`)
  })

  it("imports v8 Type Undefined value as missing value", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: xmlWithUndefinedTypeValue,
      xmlRootTag: "Settings",
    }) as Record<string, unknown>[]

    expect(result).toEqual([
      {
        itemType: "DCSParameter",
        name: "ТипЗначенияКлюча",
        title: { items: { ru: "Тип значения ключа" } },
        valueType: { type: ["Type"] },
        useRestriction: true,
      },
    ])
    expect(Object.prototype.hasOwnProperty.call(result[0], "value")).toBe(false)
  })

  it("imports reference v8 Type Undefined value so export preserves namespace", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: xmlWithUndefinedTypeValue,
      xmlRootTag: "Settings",
    })
    const referenceMetadata = testImportPropertyFromXML({
      rule,
      xmlString: xmlWithUndefinedTypeValue,
      xmlRootTag: "Settings",
      forReference: true,
    }) as Record<string, unknown>[]

    expect(referenceMetadata[0]?.value).toEqual(undefinedTypeReferenceValue)

    const exported = exportDCSParameters(result, referenceMetadata)
    expect(exported).toContain(
      '<dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value>'
    )
  })

  it("imports multiple values", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: xmlWithMultipleValues,
      xmlRootTag: "Settings",
    })

    expect(result).toEqual([
      {
        itemType: "DCSParameter",
        name: "ТипыНалогообложения",
        value: [
          {
            type: "DesignTimeValue",
            value: "Перечисление.ТипыНалогообложенияНДС.ПродажаНаЭкспорт",
          },
          {
            type: "DesignTimeValue",
            value: "Перечисление.ТипыНалогообложенияНДС.ЭкспортСырьевыхТоваровУслуг",
          },
        ],
      },
    ])
  })

  it("imports and exports ent system enumeration value", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: xmlWithAccumulationRecordTypeValue,
      xmlRootTag: "Settings",
    })

    expect(result).toEqual([
      {
        itemType: "DCSParameter",
        name: "ВидДвижения",
        valueType: { type: ["AccumulationRecordType"] },
        value: {
          type: "SystemEnumeration",
          typeSE: "AccumulationRecordType",
          value: "Expense",
        },
        useRestriction: true,
      },
    ])

    expect(exportDCSParameters(result)).toContain(
      '<dcssch:value xsi:type="ent:AccumulationRecordType">Expense</dcssch:value>'
    )
  })

  it("preserves numeric-looking edit parameter mask as xs:string through YAML", () => {
    const xml = `<Settings>
	<Parameter>
		<dcssch:name>Параметр1</dcssch:name>
		<dcssch:inputParameters>
			<dcscor:item>
				<dcscor:parameter>Маска</dcscor:parameter>
				<dcscor:value xsi:type="xs:string">123</dcscor:value>
			</dcscor:item>
		</dcssch:inputParameters>
	</Parameter>
</Settings>`

    const value = testImportPropertyFromXML({
      rule,
      xmlString: xml,
      xmlRootTag: "Settings",
    })

    expect(value).toEqual([
      {
        itemType: "DCSParameter",
        name: "Параметр1",
        editParameters: {
          itemType: "SettingsParameterValueCollection",
          parameters: {
            Маска: {
              parameter: "Маска",
              value: { type: "string", value: "123" },
            },
          },
        },
      },
    ])

    const exported = exportDCSParameters(value)

    expect(exported).toContain('<dcscor:value xsi:type="xs:string">123</dcscor:value>')
    expect(exported).not.toContain('<dcscor:value xsi:type="xs:decimal">123</dcscor:value>')

    const yaml = exportPropertyToYAML({
      context: mockContext,
      rule: yamlRule,
      value,
    })

    const yamlText = exportToYAML(yaml)
    expect(yamlText).toContain('Значение: "123"')

    const parsedYaml = importFromYAML<{ Параметры?: unknown }>(yamlText)

    const valueFromYaml = importPropertyFromYAML({
      context: mockContext,
      rule,
      value: parsedYaml.Параметры,
    })

    const exportedAfterYaml = exportDCSParameters(valueFromYaml)

    expect(exportedAfterYaml).toContain('<dcscor:value xsi:type="xs:string">123</dcscor:value>')
    expect(exportedAfterYaml).not.toContain('<dcscor:value xsi:type="xs:decimal">123</dcscor:value>')
  })
})
