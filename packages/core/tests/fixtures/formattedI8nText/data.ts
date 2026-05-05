import { FormattedI8nText, FormattedI8nTextYAML } from "~/metadata/commonObjects/formattedI8nText/types"
import { I8nText } from "~/metadata/commonObjects/i8nText/types"

export interface FormattedI8nTextFixture {
  name: string
  text: FormattedI8nText | undefined
  textFromStructure?: I8nText | undefined
  textYAML?: FormattedI8nTextYAML | undefined
  formattedTextYAML?: FormattedI8nTextYAML | undefined
  defaultLanguageYAML?: string | undefined
  otherLanguagesTextYAML?: FormattedI8nTextYAML | undefined
  otherLanguagesFormattedTextYAML?: FormattedI8nTextYAML | undefined
  xml?: string
}

export const formattedI8nTextFixtures: FormattedI8nTextFixture[] = [
  {
    name: "undefined",
    text: undefined,
    textYAML: undefined,
    formattedTextYAML: undefined,
    defaultLanguageYAML: undefined,
    otherLanguagesTextYAML: undefined,
    otherLanguagesFormattedTextYAML: undefined,
  },
  {
    name: "only default language with formatted false",
    text: { formatted: false, items: { ru: "Поле" } },
    textFromStructure: { items: { ru: "Поле" } },
    textYAML: "Поле",
    formattedTextYAML: undefined,
    defaultLanguageYAML: "Поле",
    otherLanguagesTextYAML: undefined,
    otherLanguagesFormattedTextYAML: undefined,
    xml: `<Title formatted="false">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "only default language with formatted true",
    text: { formatted: true, items: { ru: "Поле" } },
    textFromStructure: { items: { ru: "Поле" } },
    textYAML: undefined,
    formattedTextYAML: "Поле",
    defaultLanguageYAML: "Поле",
    otherLanguagesTextYAML: undefined,
    otherLanguagesFormattedTextYAML: undefined,
    xml: `<Title formatted="true">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "only other languages (single language) with formatted false",
    text: { formatted: false, items: { en: "Field" } },
    textYAML: { en: "Field" },
    formattedTextYAML: undefined,
    defaultLanguageYAML: undefined,
    otherLanguagesTextYAML: { en: "Field" },
    otherLanguagesFormattedTextYAML: undefined,
    xml: `<Title formatted="false">
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "only other languages (single language) with formatted true",
    text: { formatted: true, items: { en: "Field" } },
    textYAML: undefined,
    formattedTextYAML: { en: "Field" },
    defaultLanguageYAML: undefined,
    otherLanguagesTextYAML: undefined,
    otherLanguagesFormattedTextYAML: { en: "Field" },
    xml: `<Title formatted="true">
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "only other languages (multiple languages) with formatted false",
    text: { formatted: false, items: { en: "Field" } },
    textYAML: { en: "Field" },
    formattedTextYAML: undefined,
    defaultLanguageYAML: undefined,
    otherLanguagesTextYAML: { en: "Field" },
    otherLanguagesFormattedTextYAML: undefined,
    xml: `<Title formatted="false">
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "only other languages (multiple languages) with formatted true",
    text: { formatted: true, items: { en: "Field" } },
    textYAML: undefined,
    formattedTextYAML: { en: "Field" },
    defaultLanguageYAML: undefined,
    otherLanguagesTextYAML: undefined,
    otherLanguagesFormattedTextYAML: { en: "Field" },
    xml: `<Title formatted="true">
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "both default and other languages with formatted false",
    text: { formatted: false, items: { ru: "Поле", en: "Field" } },
    textFromStructure: { items: { ru: "Поле" } },
    textYAML: { ru: "Поле", en: "Field" },
    formattedTextYAML: undefined,
    defaultLanguageYAML: "Поле",
    otherLanguagesTextYAML: { en: "Field" },
    otherLanguagesFormattedTextYAML: undefined,
    xml: `<Title formatted="false">
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
    name: "both default and other languages with formatted true",
    text: { formatted: true, items: { ru: "Поле", en: "Field" } },
    textFromStructure: { items: { ru: "Поле" } },
    textYAML: undefined,
    formattedTextYAML: { ru: "Поле", en: "Field" },
    defaultLanguageYAML: "Поле",
    otherLanguagesTextYAML: undefined,
    otherLanguagesFormattedTextYAML: { en: "Field" },
    xml: `<Title formatted="true">
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
    name: "with escaped content and formatted false",
    text: { formatted: false, items: { ru: "<Текст с экранированным символом>" } },
    textFromStructure: { items: { ru: "<Текст с экранированным символом>" } },
    textYAML: "<Текст с экранированным символом>",
    formattedTextYAML: undefined,
    defaultLanguageYAML: "<Текст с экранированным символом>",
    otherLanguagesTextYAML: undefined,
    otherLanguagesFormattedTextYAML: undefined,
    xml: `<Title formatted="false">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>&lt;Текст с экранированным символом&gt;</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "with escaped content and formatted true",
    text: { formatted: true, items: { ru: '<">' } },
    textFromStructure: { items: { ru: '<">' } },
    textYAML: undefined,
    formattedTextYAML: '<">',
    defaultLanguageYAML: '<">',
    otherLanguagesTextYAML: undefined,
    otherLanguagesFormattedTextYAML: undefined,
    xml: `<Title formatted="true">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>&lt;&quot;&gt;</v8:content>
	</v8:item>
</Title>`,
  },
]
