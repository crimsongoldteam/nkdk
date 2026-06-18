import { MetadataFormChoiceListValue, MetadataFormChoiceListValueYAML } from "~/metadata/commonObjects/metadataValue/types"
import { explicitYAMLString } from "~/yaml/explicitString"

export const withStringValue: MetadataFormChoiceListValue = {
  type: "formChoiceListDesTimeValue",
  presentation: { items: { ru: "Физическое лицо" } },
  value: { type: "string", value: "ФЛ" },
}

export const withStringValueXML = `<Value xsi:type="FormChoiceListDesTimeValue">
	<Presentation>
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>Физическое лицо</v8:content>
		</v8:item>
	</Presentation>
	<Value xsi:type="xs:string">ФЛ</Value>
</Value>`

export const withStringValueYAML: MetadataFormChoiceListValueYAML = {
  Представление: "Физическое лицо",
  Значение: explicitYAMLString("ФЛ"),
}

export const withoutPresentation: MetadataFormChoiceListValue = {
  type: "formChoiceListDesTimeValue",
  value: { type: "boolean", value: true },
}

export const withoutPresentationXML = `<Value xsi:type="FormChoiceListDesTimeValue">
	<Presentation/>
	<Value xsi:type="xs:boolean">true</Value>
</Value>`

export const withoutPresentationYAML: MetadataFormChoiceListValueYAML = {
  Значение: "Истина",
}

export const withMultiLangPresentation: MetadataFormChoiceListValue = {
  type: "formChoiceListDesTimeValue",
  presentation: { items: { ru: "Физическое лицо", en: "Physical person" } },
  value: { type: "string", value: "ФЛ" },
}

export const withMultiLangPresentationXML = `<Value xsi:type="FormChoiceListDesTimeValue">
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
</Value>`

export const withMultiLangPresentationYAML: MetadataFormChoiceListValueYAML = {
  Представление: { ru: "Физическое лицо", en: "Physical person" },
  Значение: explicitYAMLString("ФЛ"),
}

export const withNumericPresentation: MetadataFormChoiceListValue = {
  type: "formChoiceListDesTimeValue",
  presentation: { items: { ru: "2.0" } },
  value: { type: "boolean", value: false },
}

export const withNumericPresentationXML = `<Value xsi:type="FormChoiceListDesTimeValue">
	<Presentation>
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>2.0</v8:content>
		</v8:item>
	</Presentation>
	<Value xsi:type="xs:boolean">false</Value>
</Value>`

export const withNumericPresentationYAML: MetadataFormChoiceListValueYAML = {
  Представление: "2.0",
  Значение: "Ложь",
}
