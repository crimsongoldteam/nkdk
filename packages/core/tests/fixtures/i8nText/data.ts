import { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"

export interface I8nTextFixture {
  name: string
  text: I8nText | undefined
  textFromStructure?: I8nText | undefined
  fullYAML?: I8nTextYAML | undefined
  defaultLanguageYAML?: string | undefined
  otherLanguagesYAML?: I8nTextYAML | undefined
  xml?: string
}

export const i8nTextFixtures: I8nTextFixture[] = [
  {
    name: "undefined",
    text: undefined,
    textFromStructure: undefined,
    fullYAML: undefined,
    defaultLanguageYAML: undefined,
    otherLanguagesYAML: undefined,
  },
  {
    name: "only default language",
    text: { items: { ru: "Поле" } },
    textFromStructure: { items: { ru: "Поле" } },
    fullYAML: "Поле",
    defaultLanguageYAML: "Поле",
    otherLanguagesYAML: undefined,
    xml: `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "only other languages (single language)",
    text: { items: { en: "Field" } },
    textFromStructure: undefined,
    fullYAML: { en: "Field" },
    defaultLanguageYAML: undefined,
    otherLanguagesYAML: { en: "Field" },
    xml: `<Title>
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "only other languages (multiple languages)",
    text: { items: { en: "Field", de: "Feld" } },
    textFromStructure: undefined,
    fullYAML: { en: "Field", de: "Feld" },
    defaultLanguageYAML: undefined,
    otherLanguagesYAML: { en: "Field", de: "Feld" },
    xml: `<Title>
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
	<v8:item>
		<v8:lang>de</v8:lang>
		<v8:content>Feld</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "both default and other languages",
    text: { items: { ru: "Поле", en: "Field" } },
    textFromStructure: { items: { ru: "Поле" } },
    fullYAML: { ru: "Поле", en: "Field" },
    defaultLanguageYAML: "Поле",
    otherLanguagesYAML: { en: "Field" },
    xml: `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "default language with multiple languages, other languages empty",
    text: { items: { ru: "Поле", en: "Field" } },
    textFromStructure: { items: { ru: "Поле", en: "Field" } },
    fullYAML: { ru: "Поле", en: "Field" },
    defaultLanguageYAML: "Поле",
    otherLanguagesYAML: { en: "Field" },
    xml: `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "only non-default language",
    text: { items: { en: "Поле" } },
    textFromStructure: undefined,
    fullYAML: { en: "Поле" },
    defaultLanguageYAML: undefined,
    otherLanguagesYAML: { en: "Поле" },
    xml: `<Title>
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "with escaped content",
    text: { items: { ru: '<">' } },
    textFromStructure: { items: { ru: '<">' } },
    fullYAML: '<">',
    defaultLanguageYAML: '<">',
    otherLanguagesYAML: undefined,
    xml: `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>&lt;&quot;&gt;</v8:content>
	</v8:item>
</Title>`,
  },
]
