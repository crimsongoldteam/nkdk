import type { Color, ColorYAML } from "../../../color/types"
import type { I8nText } from "../../../i8nText/types"
import type { ChoiceParameterLinks, ChoiceParameterLinksYAML } from "../../../сhoiceParameterLinks/types"
import type { ChoiceParameter, ChoiceParametersYAML } from "../../../сhoiceParameters/types"
import { fixtureTypeLink } from "../../dcsMetadataValue/__fixtures__/data"
import type {
  ParameterValue,
  ParameterValueYAML,
  SettingsParameterValue,
  SettingsParameterValuePropertyRule,
  SettingsParameterValueYAML,
} from "../types"

export const fixtureColorWebRed: Color = {
  type: "WebColor",
  value: "Red",
}

export const fixtureColorWebRedYAML: ColorYAML = "Красный"

export const fixtureFormatLocalString: I8nText = {
  items: {
    ru: "ЧЦ=3; ЧДЦ=2",
  },
}

export const fixtureFormatLocalStringYAML = "ЧЦ=3; ЧДЦ=2"

export const fixtureChoiceParameterDecimal: ChoiceParameter = {
  name: "Параметр",
  value: {
    type: "decimal",
    value: 123,
  },
}

export const fixtureChoiceParameterDecimalYAML: ChoiceParametersYAML = {
  Параметр: 123,
}

export const fixtureChoiceParameterLinks: ChoiceParameterLinks = [
  {
    name: "ПараметрВыбора",
    dataPath: "Поле1",
    valueChange: "DontChange",
  },
]

export const fixtureChoiceParameterLinksYAML: ChoiceParameterLinksYAML = [
  {
    Имя: "ПараметрВыбора",
    ПутьКДанным: "Поле1",
    РежимИзменения: "НеИзменять",
  },
]

const xmlFull = `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:parameter>Формат</dcscor:parameter>
	<dcscor:value xsi:type="v8:LocalStringType">
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>ЧЦ=3; ЧДЦ=2</v8:content>
		</v8:item>
	</dcscor:value>
</dcscor:item>`

const xmlUseFalse = `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:use>false</dcscor:use>
	<dcscor:parameter>ЦветФона</dcscor:parameter>
	<dcscor:value xsi:type="v8ui:Color">web:Red</dcscor:value>
</dcscor:item>`

const xmlTypeLink = `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:parameter>СвязьПоТипу</dcscor:parameter>
	<dcscor:value xsi:type="dcscor:TypeLink">
		<dcscor:field>Поле1</dcscor:field>
		<dcscor:linkItem>2</dcscor:linkItem>
	</dcscor:value>
</dcscor:item>`

const xmlChoiceParameters = `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:parameter>ПараметрыВыбора</dcscor:parameter>
	<dcscor:value xsi:type="dcscor:ChoiceParameters">
		<dcscor:item>
			<dcscor:choiceParameter>Параметр</dcscor:choiceParameter>
			<dcscor:value xsi:type="xs:decimal">123</dcscor:value>
		</dcscor:item>
	</dcscor:value>
</dcscor:item>`

const xmlChoiceParameterLinks = `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:parameter>СвязиПараметровВыбора</dcscor:parameter>
	<dcscor:value xsi:type="dcscor:ChoiceParameterLinks">
		<dcscor:item>
			<dcscor:choiceParameter>ПараметрВыбора</dcscor:choiceParameter>
			<dcscor:value>Поле1</dcscor:value>
			<dcscor:mode xsi:type="ent:LinkedValueChangeMode">DontChange</dcscor:mode>
		</dcscor:item>
	</dcscor:value>
</dcscor:item>`

const xmlSystemEnumeration = `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:parameter>ВыборГруппИЭлементов</dcscor:parameter>
	<dcscor:value xsi:type="ent:FoldersAndItemsUse">Items</dcscor:value>
</dcscor:item>`

const xmlFewValues = `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:use>false</dcscor:use>
	<dcscor:parameter>ИмяПараметра</dcscor:parameter>
	<dcscor:value xsi:type="v8:LocalStringType">
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>Перечисление.ИмяПеречисления.Значение1</v8:content>
		</v8:item>
	</dcscor:value>
	<dcscor:value xsi:type="v8:LocalStringType">
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>Перечисление.ИмяПеречисления.Значение2</v8:content>
		</v8:item>
	</dcscor:value>
</dcscor:item>`

export const xmlNilSettingsParameterValue = `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:use>false</dcscor:use>
	<dcscor:parameter>Текст</dcscor:parameter>
	<dcscor:value xsi:nil="true"/>
</dcscor:item>`

export const nilSettingsParameterValueRule: SettingsParameterValuePropertyRule = {
  type: "SettingsParameterValue",
  valueType: "DesignTimeValue",
  yaml: "Текст",
}

export const nilSettingsParameterValue = {
  use: false,
  parameter: "Текст",
} satisfies SettingsParameterValue

export type ParameterValueFixture = {
  id: string
  title: string
  rule: SettingsParameterValuePropertyRule
  value: ParameterValue | SettingsParameterValue
  yaml: ParameterValueYAML | SettingsParameterValueYAML
  xml?: string
}

export const parameterValueFixtures: ParameterValueFixture[] = [
  {
    id: "full",
    title: "full (DesignTimeValue / LocalStringType)",
    rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Формат" },
    value: {
      parameter: "Формат",
      value: fixtureFormatLocalString,
    },
    yaml: {
      Тип: "МногоязычнаяСтрока",
      Значение: fixtureFormatLocalStringYAML,
    },
    xml: xmlFull,
  },
  {
    id: "useFalse",
    title: "useFalse (Color)",
    rule: { type: "SettingsParameterValue", valueType: "Color", yaml: "ЦветФона" },
    value: {
      use: false,
      parameter: "ЦветФона",
      value: fixtureColorWebRed,
    },
    yaml: {
      Использовать: "Ложь",
      Значение: fixtureColorWebRedYAML,
    },
    xml: xmlUseFalse,
  },
  {
    id: "typeLink",
    title: "typeLink (TypeLink, без xsi:type на вложенном item)",
    rule: { type: "SettingsParameterValue", valueType: "TypeLink", yaml: "СвязьПоТипу" },
    value: {
      parameter: "СвязьПоТипу",
      value: fixtureTypeLink,
    },
    yaml: {
      Значение: "Поле1(2)",
    },
    xml: xmlTypeLink,
  },
  {
    id: "choiceParameters",
    title: "choiceParameters (Parameter)",
    rule: { type: "SettingsParameterValue", valueType: "Parameter", yaml: "ПараметрыВыбора" },
    value: {
      parameter: "ПараметрыВыбора",
      value: fixtureChoiceParameterDecimal,
    },
    yaml: {
      Значение: fixtureChoiceParameterDecimalYAML,
    },
    xml: xmlChoiceParameters,
  },
  {
    id: "choiceParameterLinks",
    title: "choiceParameterLinks (ChoiceParameterLinks)",
    rule: {
      type: "SettingsParameterValue",
      valueType: "ChoiceParameterLinks",
      yaml: "СвязиПараметровВыбора",
    },
    value: {
      parameter: "СвязиПараметровВыбора",
      value: fixtureChoiceParameterLinks,
    },
    yaml: {
      Значение: fixtureChoiceParameterLinksYAML,
    },
    xml: xmlChoiceParameterLinks,
  },
  {
    id: "systemEnumeration",
    title: "systemEnumeration (FoldersAndItemsUse)",
    rule: {
      type: "SettingsParameterValue",
      valueType: "SystemEnumeration",
      typeSE: "FoldersAndItemsUse",
      yaml: "ВыборГруппИЭлементов",
    },
    value: {
      parameter: "ВыборГруппИЭлементов",
      value: "Items",
    },
    yaml: {
      Значение: "Элементы",
    },
    xml: xmlSystemEnumeration,
  },
  {
    id: "fewValues",
    title: "fewValues (два v8:LocalStringType)",
    rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "ИмяПараметра" },
    value: {
      use: false,
      parameter: "ИмяПараметра",
      value: [
        { items: { ru: "Перечисление.ИмяПеречисления.Значение1" } },
        { items: { ru: "Перечисление.ИмяПеречисления.Значение2" } },
      ],
    },
    yaml: {
      Использовать: "Ложь",
      Значение: [
        {
          Тип: "МногоязычнаяСтрока",
          Значение: "Перечисление.ИмяПеречисления.Значение1",
        },
        {
          Тип: "МногоязычнаяСтрока",
          Значение: "Перечисление.ИмяПеречисления.Значение2",
        },
      ],
    },
    xml: xmlFewValues,
  },
  {
    id: "shortOnlyValue",
    title: "short value-only (Color)",
    rule: { type: "SettingsParameterValue", valueType: "Color", yaml: "ЦветТекста" },
    value: {
      parameter: "ЦветТекста",
      value: {
        type: "WebColor",
        value: "Blue",
      },
    },
    yaml: {
      Значение: "Синий",
    },
    xml: `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:parameter>ЦветТекста</dcscor:parameter>
	<dcscor:value xsi:type="v8ui:Color">web:Blue</dcscor:value>
</dcscor:item>`,
  },
]
