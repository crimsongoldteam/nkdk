import { DcsMetadataTypedValue, DcsMetadataTypedValueYAML } from "../types"

type DcsMetadataTypedValueFixture = {
  name: string
  model: DcsMetadataTypedValue
  YAML: DcsMetadataTypedValueYAML
  XML: string
}

export const emptyValueListTypedValue: DcsMetadataTypedValue = {
  type: "EmptyValueList",
}

export const dcsMetadataTypedValueFixtures: DcsMetadataTypedValueFixture[] = [
  {
    name: "field",
    model: { type: "Field", value: "СтандартныйПериод.ДатаНачала" },
    YAML: ".СтандартныйПериод.ДатаНачала",
    XML: '<value xsi:type="dcscor:Field">СтандартныйПериод.ДатаНачала</value>',
  },
  {
    name: "designTimeValue",
    model: { type: "DesignTimeValue", value: "Справочник.Справочник1.ПустаяСсылка" },
    YAML: "Справочник.Справочник1.ПустаяСсылка",
    XML: '<value xsi:type="dcscor:DesignTimeValue">Справочник.Справочник1.ПустаяСсылка</value>',
  },
  {
    name: "decimal",
    model: { type: "decimal", value: 0 },
    YAML: 0,
    XML: '<value xsi:type="xs:decimal">0</value>',
  },
  {
    name: "boolean",
    model: { type: "boolean", value: false },
    YAML: "Ложь",
    XML: '<value xsi:type="xs:boolean">false</value>',
  },
  {
    name: "string",
    model: { type: "string", value: "Какой-то текст" },
    YAML: "'Какой-то текст'",
    XML: '<value xsi:type="xs:string">Какой-то текст</value>',
  },
  {
    name: "empty string",
    model: { type: "string", value: "" },
    YAML: "''",
    XML: '<value xsi:type="xs:string"/>',
  },
  {
    name: "standardBeginningDate",
    model: { type: "StandardBeginningDate", value: { variant: "Custom", date: "0001-01-01T00:00:00" } },
    YAML: { Вариант: "ПроизвольнаяДата", Дата: "01.01.0001 00:00:00" },
    XML: `<value xsi:type="v8:StandardBeginningDate">
	<v8:variant xsi:type="v8:StandardBeginningDateVariant">Custom</v8:variant>
	<v8:date>0001-01-01T00:00:00</v8:date>
</value>`,
  },
  {
    name: "standardBeginningDate",
    model: { type: "StandardBeginningDate", value: { variant: "BeginningOfThisDay" } },
    YAML: { Вариант: "НачалоЭтогоДня" },
    XML: `<value xsi:type="v8:StandardBeginningDate">
	<v8:variant xsi:type="v8:StandardBeginningDateVariant">BeginningOfThisDay</v8:variant>
</value>`,
  },
]
