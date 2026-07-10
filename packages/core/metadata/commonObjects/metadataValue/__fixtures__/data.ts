import { MetadataValue, MetadataValuePropertyRule, MetadataValueYAML } from "../types"
import { explicitYAMLString } from "../../../../yaml/explicitString"

type MetadataValueFixture = {
  name: string
  rule: MetadataValuePropertyRule
  internal: MetadataValue | undefined
  YAML: MetadataValueYAML | undefined
  XML: string
}

export const metadataValueFixtures: MetadataValueFixture[] = [
  {
    name: "string",
    rule: { type: "MetadataValue" },
    internal: { type: "string", value: "Текстовое значение" },
    YAML: explicitYAMLString("Текстовое значение"),
    XML: '<Value xsi:type="xs:string">Текстовое значение</Value>',
  },
  {
    name: "numberAsString",
    rule: { type: "MetadataValue", valueType: ["string"] },
    internal: { type: "string", value: "11" },
    YAML: explicitYAMLString("11"),
    XML: '<Value xsi:type="xs:string">11</Value>',
  },
  {
    name: "boolean",
    rule: { type: "MetadataValue", valueType: ["boolean"] },
    internal: { type: "boolean", value: true },
    YAML: "Истина",
    XML: '<Value xsi:type="xs:boolean">true</Value>',
  },
  {
    name: "decimal",
    rule: { type: "MetadataValue", valueType: ["decimal"] },
    internal: { type: "decimal", value: 10 },
    YAML: 10,
    XML: '<Value xsi:type="xs:decimal">10</Value>',
  },
  {
    name: "decimalZero",
    rule: { type: "MetadataValue", valueType: ["decimal"] },
    internal: { type: "decimal", value: 0 },
    YAML: 0,
    XML: '<Value xsi:type="xs:decimal">0</Value>',
  },
  {
    name: "dateTime",
    rule: { type: "MetadataValue", valueType: ["dateTime"] },
    internal: { type: "dateTime", value: "2025-12-24T12:00:00" },
    YAML: "24.12.2025 12:00:00",
    XML: '<Value xsi:type="xs:dateTime">2025-12-24T12:00:00</Value>',
  },
  {
    name: "enum",
    rule: { type: "MetadataValue", valueType: ["ref"] },
    internal: { type: "ref", value: "Enum.ВидыДоговоров.EnumValue.СПоставщиком" },
    YAML: "Перечисление.ВидыДоговоров.СПоставщиком",
    XML: '<Value xsi:type="xr:DesignTimeRef">Enum.ВидыДоговоров.EnumValue.СПоставщиком</Value>',
  },
  {
    name: "catalog",
    rule: { type: "MetadataValue", valueType: ["ref"] },
    internal: { type: "ref", value: "Catalog.Пользователи.EmptyRef" },
    YAML: "Справочник.Пользователи.ПустаяСсылка",
    XML: '<Value xsi:type="xr:DesignTimeRef">Catalog.Пользователи.EmptyRef</Value>',
  },
  {
    name: "emptyRef",
    rule: { type: "MetadataValue", valueType: ["ref"] },
    internal: { type: "ref", value: "" },
    YAML: ".",
    XML: '<Value xsi:type="xr:DesignTimeRef"/>',
  },
  {
    name: "fixedArray",
    rule: { type: "MetadataValue", valueType: ["fixedArray"] },
    internal: {
      type: "fixedArray",
      value: [
        { type: "ref", value: "Enum.ТипыСчетов.EnumValue.КосвенныеЗатраты" },
        { type: "ref", value: "Enum.ТипыСчетов.EnumValue.Расходы" },
      ],
    },
    YAML: ["Перечисление.ТипыСчетов.КосвенныеЗатраты", "Перечисление.ТипыСчетов.Расходы"],
    XML: `<Value xsi:type="v8:FixedArray">
	<v8:Value xsi:type="xr:DesignTimeRef">Enum.ТипыСчетов.EnumValue.КосвенныеЗатраты</v8:Value>
	<v8:Value xsi:type="xr:DesignTimeRef">Enum.ТипыСчетов.EnumValue.Расходы</v8:Value>
</Value>`,
  },
  {
    name: "formChoiceListDesTimeValue",
    rule: { type: "MetadataValue", valueType: ["formChoiceListDesTimeValue"] },
    internal: {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: "Физическое лицо" } },
      value: { type: "string", value: "ФЛ" },
    },
    YAML: {
      Представление: "Физическое лицо",
      Значение: explicitYAMLString("ФЛ"),
    },
    XML: `<Value xsi:type="FormChoiceListDesTimeValue">
	<Presentation>
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>Физическое лицо</v8:content>
		</v8:item>
	</Presentation>
	<Value xsi:type="xs:string">ФЛ</Value>
</Value>`,
  },
  {
    name: "formChoiceListDesTimeValue_multilang",
    rule: { type: "MetadataValue", valueType: ["formChoiceListDesTimeValue"] },
    internal: {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: "Физическое лицо", en: "Physical person" } },
      value: { type: "string", value: "ФЛ" },
    },
    YAML: {
      Представление: { ru: "Физическое лицо", en: "Physical person" },
      Значение: explicitYAMLString("ФЛ"),
    },
    XML: `<Value xsi:type="FormChoiceListDesTimeValue">
	<Presentation>
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>Физическое лицо</v8:content>
		</v8:item>
		<v8:item>
			<v8:lang>en</v8:lang>
			<v8:content>Physical person</v8:content>
		</v8:item>
	</Presentation>
	<Value xsi:type="xs:string">ФЛ</Value>
</Value>`,
  },
  {
    name: "metadataRef_objectRef",
    rule: { type: "MetadataValue", valueType: ["objectRef"] },
    internal: { type: "objectRef", value: "ChartOfCharacteristicTypes.ДополнительныеРеквизитыИСведения" },
    YAML: undefined,
    XML: '<Value xsi:type="xr:MDObjectRef">ChartOfCharacteristicTypes.ДополнительныеРеквизитыИСведения</Value>',
  },
  {
    name: "emptyString",
    rule: { type: "MetadataValue", valueType: ["string"] },
    internal: { type: "string", value: "" },
    YAML: explicitYAMLString(""),
    XML: '<Value xsi:type="xs:string"/>',
  },
  {
    name: "valueList",
    rule: { type: "MetadataValue", valueType: ["valueList"] },
    internal: { type: "valueList" },
    YAML: "СписокЗначений",
    XML: '<Value xsi:type="xr:ValueList"/>',
  },
  {
    name: "standardPeriod",
    rule: { type: "MetadataValue", valueType: ["standardPeriod"] },
    internal: {
      type: "standardPeriod",
      value: {
        variant: "Custom",
        startDate: "0001-01-01T00:00:00",
        endDate: "0001-01-01T00:00:00",
      },
    },
    YAML: {
      Вариант: "ПроизвольныйПериод",
      ДатаНачала: "01.01.0001 00:00:00",
      ДатаОкончания: "01.01.0001 00:00:00",
    },
    XML: `<Value xsi:type="v8:StandardPeriod">
	<v8:variant xsi:type="v8:StandardPeriodVariant">Custom</v8:variant>
	<v8:startDate>0001-01-01T00:00:00</v8:startDate>
	<v8:endDate>0001-01-01T00:00:00</v8:endDate>
</Value>`,
  },
]
