import { MetadataFormChoiceListValue, MetadataFormChoiceListValueYAML } from "~/metadata/commonObjects/metadataValue/types"

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

export const withStringValueYAML: MetadataFormChoiceListValueYAML = '"ФЛ"(Физическое лицо)'

export const withoutPresentation: MetadataFormChoiceListValue = {
  type: "formChoiceListDesTimeValue",
  value: { type: "boolean", value: true },
}

export const withoutPresentationXML = `<Value xsi:type="FormChoiceListDesTimeValue">
	<Presentation/>
	<Value xsi:type="xs:boolean">true</Value>
</Value>`

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
  Значение: '"ФЛ"',
}
