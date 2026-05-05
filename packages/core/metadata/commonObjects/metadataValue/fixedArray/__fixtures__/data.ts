import { MetadataFixedArrayValue, MetadataFixedArrayValueYAML } from "~/metadata/commonObjects/metadataValue/types"

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

export const singleStringFixedArray: MetadataFixedArrayValue = {
  type: "fixedArray",
  value: [{ type: "string", value: "Тест" }],
}

export const singleStringFixedArrayXML = `<Value xsi:type="v8:FixedArray">
	<v8:Value xsi:type="xs:string">Тест</v8:Value>
</Value>`

export const singleStringFixedArrayYAML: MetadataFixedArrayValueYAML = ['"Тест"']
