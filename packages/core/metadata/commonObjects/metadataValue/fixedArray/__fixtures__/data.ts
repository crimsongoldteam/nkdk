import { MetadataFixedArrayValue, MetadataFixedArrayValueYAML } from "~/metadata/commonObjects/metadataValue/types"
import { explicitYAMLString } from "~/yaml/explicitString"

export const twoRefsFixedArray: MetadataFixedArrayValue = {
  type: "fixedArray",
  value: [
    { type: "ref", value: "Enum.ТипыСчетов.EnumValue.КосвенныеЗатраты" },
    { type: "ref", value: "Enum.ТипыСчетов.EnumValue.Расходы" },
  ],
}

export const twoRefsFixedArrayXML = `<Value xsi:type="v8:FixedArray">
	<v8:Value xsi:type="xr:DesignTimeRef">Enum.ТипыСчетов.EnumValue.КосвенныеЗатраты</v8:Value>
	<v8:Value xsi:type="xr:DesignTimeRef">Enum.ТипыСчетов.EnumValue.Расходы</v8:Value>
</Value>`

export const twoRefsFixedArrayYAML: MetadataFixedArrayValueYAML = [
  "Перечисление.ТипыСчетов.КосвенныеЗатраты",
  "Перечисление.ТипыСчетов.Расходы",
]

export const formChoiceRefsFixedArray = {
  type: "fixedArray",
  value: [
    {
      type: "formChoiceListDesTimeValue",
      value: {
        type: "ref",
        value: "Enum.ТипыДоговоров.EnumValue.СПоставщиком",
      },
    },
    {
      type: "formChoiceListDesTimeValue",
      value: {
        type: "ref",
        value: "Enum.ТипыДоговоров.EnumValue.СКомитентом",
      },
    },
  ],
} satisfies MetadataFixedArrayValue

export const formChoiceRefsFixedArrayYAML: MetadataFixedArrayValueYAML = [
  "Перечисление.ТипыДоговоров.СПоставщиком",
  "Перечисление.ТипыДоговоров.СКомитентом",
]

export const singleStringFixedArray: MetadataFixedArrayValue = {
  type: "fixedArray",
  value: [{ type: "string", value: "Тест" }],
}

export const singleStringFixedArrayXML = `<Value xsi:type="v8:FixedArray">
	<v8:Value xsi:type="xs:string">Тест</v8:Value>
</Value>`

export const singleStringFixedArrayYAML: MetadataFixedArrayValueYAML = [explicitYAMLString("Тест")]

export const refsWithNilFixedArray: MetadataFixedArrayValue = {
  type: "fixedArray",
  value: [
    { type: "ref", value: "Enum.ХозяйственныеОперации.EnumValue.РеализацияКлиенту" },
    undefined,
    { type: "ref", value: "Enum.ХозяйственныеОперации.EmptyRef" },
  ],
}

export const refsWithNilFixedArrayXML = `<Value xsi:type="v8:FixedArray">
	<v8:Value xsi:type="xr:DesignTimeRef">Enum.ХозяйственныеОперации.EnumValue.РеализацияКлиенту</v8:Value>
	<v8:Value xsi:nil="true"/>
	<v8:Value xsi:type="xr:DesignTimeRef">Enum.ХозяйственныеОперации.EmptyRef</v8:Value>
</Value>`

export const refsWithNilFixedArrayYAML: MetadataFixedArrayValueYAML = [
  "Перечисление.ХозяйственныеОперации.РеализацияКлиенту",
  undefined,
  "Перечисление.ХозяйственныеОперации.ПустаяСсылка",
]
