import {
  MetadataTypedValuePropertyRule,
  MetadataValue,
  MetadataValuePropertyRule,
  MetadataValueYAML,
} from "~/metadata/commonObjects/metadataValue/types"

type MetadataValueFixture = {
  name: string
  rule: MetadataValuePropertyRule
  ruleWithType: MetadataTypedValuePropertyRule
  internal: MetadataValue | string | boolean | number | undefined
  internalWithType: MetadataValue | string | boolean | number | undefined
  YAML: MetadataValueYAML | string | boolean | number | undefined
  YAMLWithType: MetadataValueYAML | string | boolean | number | undefined
  XML: string
}

export const metadataValueFixtures: MetadataValueFixture[] = [
  {
    name: "string",
    rule: { type: "MetadataValue" },
    ruleWithType: { type: "MetadataValue", valueType: "string", withType: true },
    internal: "Текстовое значение",
    internalWithType: { type: "string", value: "Текстовое значение" },
    YAML: "Текстовое значение",
    YAMLWithType: '"Текстовое значение"',
    XML: '<Value xsi:type="xs:string">Текстовое значение</Value>',
  },
  {
    name: "numberAsString",
    rule: { type: "MetadataValue", valueType: "string" },
    internal: 11,
    ruleWithType: { type: "MetadataValue", valueType: "string", withType: true },
    internalWithType: { type: "string", value: "11" },
    YAML: 11,
    YAMLWithType: '"11"',
    XML: '<Value xsi:type="xs:string">11</Value>',
  },
  {
    name: "boolean",
    rule: { type: "MetadataValue", valueType: "boolean" },
    internal: { type: "boolean", value: true },
    ruleWithType: { type: "MetadataValue", valueType: "boolean", withType: true },
    internalWithType: { type: "boolean", value: true },
    YAML: "Истина",
    YAMLWithType: "Истина",
    XML: '<Value xsi:type="xs:boolean">true</Value>',
  },
  {
    name: "decimal",
    rule: { type: "MetadataValue", valueType: "decimal" },
    internal: { type: "decimal", value: 10 },
    ruleWithType: { type: "MetadataValue", valueType: "decimal", withType: true },
    internalWithType: { type: "decimal", value: 10 },
    YAML: 10,
    YAMLWithType: 10,
    XML: '<Value xsi:type="xs:decimal">10</Value>',
  },
  {
    name: "decimalZero",
    rule: { type: "MetadataValue", valueType: "decimal" },
    internal: { type: "decimal", value: 0 },
    ruleWithType: { type: "MetadataValue", valueType: "decimal", withType: true },
    internalWithType: { type: "decimal", value: 0 },
    YAML: 0,
    YAMLWithType: 0,
    XML: '<Value xsi:type="xs:decimal">0</Value>',
  },
  {
    name: "dateTime",
    rule: { type: "MetadataValue", valueType: "dateTime" },
    internal: { type: "dateTime", value: "2025-12-24T12:00:00" },
    ruleWithType: { type: "MetadataValue", valueType: "dateTime", withType: true },
    internalWithType: { type: "dateTime", value: "2025-12-24T12:00:00" },
    YAML: "24.12.2025 12:00:00",
    YAMLWithType: "24.12.2025 12:00:00",
    XML: '<Value xsi:type="xs:dateTime">2025-12-24T12:00:00</Value>',
  },
  {
    name: "enum",
    rule: { type: "MetadataValue", valueType: "ref" },
    internal: { type: "ref", value: "Enum.ВидыДоговоров.EnumValue.СПоставщиком" },
    ruleWithType: { type: "MetadataValue", valueType: "ref", withType: true },
    internalWithType: { type: "ref", value: "Enum.ВидыДоговоров.EnumValue.СПоставщиком" },
    YAML: "Перечисление.ВидыДоговоров.СПоставщиком",
    YAMLWithType: "Перечисление.ВидыДоговоров.СПоставщиком",
    XML: '<Value xsi:type="xr:DesignTimeRef">Enum.ВидыДоговоров.EnumValue.СПоставщиком</Value>',
  },
  {
    name: "catalog",
    rule: { type: "MetadataValue", valueType: "ref" },
    internal: { type: "ref", value: "Catalog.Пользователи.EmptyRef" },
    ruleWithType: { type: "MetadataValue", valueType: "ref", withType: true },
    internalWithType: { type: "ref", value: "Catalog.Пользователи.EmptyRef" },
    YAML: "Справочник.Пользователи.ПустаяСсылка",
    YAMLWithType: "Справочник.Пользователи.ПустаяСсылка",
    XML: '<Value xsi:type="xr:DesignTimeRef">Catalog.Пользователи.EmptyRef</Value>',
  },
  {
    name: "emptyRef",
    rule: { type: "MetadataValue", valueType: "ref" },
    internal: undefined,
    ruleWithType: { type: "MetadataValue", valueType: "ref", withType: true },
    internalWithType: undefined,
    YAML: undefined,
    YAMLWithType: undefined,
    XML: '<Value xsi:type="xr:DesignTimeRef"/>',
  },
  {
    name: "fixedArray",
    rule: { type: "MetadataValue", valueType: "fixedArray" },
    ruleWithType: { type: "MetadataValue", valueType: "fixedArray" },
    internal: {
      type: "fixedArray",
      value: [
        { type: "ref", value: "Enum.ТипыСчетов.EnumValue.КосвенныеЗатраты" },
        { type: "ref", value: "Enum.ТипыСчетов.EnumValue.Расходы" },
      ],
    },
    internalWithType: {
      type: "fixedArray",
      value: [
        { type: "ref", value: "Enum.ТипыСчетов.EnumValue.КосвенныеЗатраты" },
        { type: "ref", value: "Enum.ТипыСчетов.EnumValue.Расходы" },
      ],
    },
    YAML: ["Перечисление.ТипыСчетов.КосвенныеЗатраты", "Перечисление.ТипыСчетов.Расходы"],
    YAMLWithType: ["Перечисление.ТипыСчетов.КосвенныеЗатраты", "Перечисление.ТипыСчетов.Расходы"],
    XML: `<Value xsi:type="v8:FixedArray">
	<v8:Value xsi:type="xr:DesignTimeRef">Enum.ТипыСчетов.EnumValue.КосвенныеЗатраты</v8:Value>
	<v8:Value xsi:type="xr:DesignTimeRef">Enum.ТипыСчетов.EnumValue.Расходы</v8:Value>
</Value>`,
  },
  {
    name: "formChoiceListDesTimeValue",
    rule: { type: "MetadataValue", valueType: "formChoiceListDesTimeValue" },
    ruleWithType: { type: "MetadataValue", valueType: "formChoiceListDesTimeValue" },
    internal: {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: "Физическое лицо" } },
      value: { type: "string", value: "ФЛ" },
    },
    internalWithType: {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: "Физическое лицо" } },
      value: { type: "string", value: "ФЛ" },
    },
    YAML: '"ФЛ"(Физическое лицо)',
    YAMLWithType: '"ФЛ"(Физическое лицо)',
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
    rule: { type: "MetadataValue", valueType: "formChoiceListDesTimeValue" },
    ruleWithType: { type: "MetadataValue", valueType: "formChoiceListDesTimeValue" },
    internal: {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: "Физическое лицо", en: "Physical person" } },
      value: { type: "string", value: "ФЛ" },
    },
    internalWithType: {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: "Физическое лицо", en: "Physical person" } },
      value: { type: "string", value: "ФЛ" },
    },
    YAML: {
      Представление: { ru: "Физическое лицо", en: "Physical person" },
      Значение: '"ФЛ"',
    },
    YAMLWithType: {
      Представление: { ru: "Физическое лицо", en: "Physical person" },
      Значение: '"ФЛ"',
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
    rule: { type: "MetadataValue", valueType: "objectRef" },
    internal: { type: "objectRef", value: "ChartOfCharacteristicTypes.ДополнительныеРеквизитыИСведения" },
    ruleWithType: { type: "MetadataValue", valueType: "objectRef", withType: true },
    internalWithType: { type: "objectRef", value: "ChartOfCharacteristicTypes.ДополнительныеРеквизитыИСведения" },
    YAML: undefined,
    YAMLWithType: undefined,
    XML: '<Value xsi:type="xr:MDObjectRef">ChartOfCharacteristicTypes.ДополнительныеРеквизитыИСведения</Value>',
  },
  {
    name: "emptyString",
    rule: { type: "MetadataValue", valueType: "string" },
    internal: undefined,
    ruleWithType: { type: "MetadataValue", valueType: "string", withType: true },
    internalWithType: undefined,
    YAML: undefined,
    YAMLWithType: undefined,
    XML: '<Value xsi:type="xs:string"/>',
  },
]
