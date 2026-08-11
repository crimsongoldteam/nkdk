import { FormattedI8nText, FormattedI8nTextValueYAML } from "../types"
import { I8nText, I8nTextYAML } from "../../i8nText/types"

export interface FormattedI8nTextFixture {
  name: string
  text: FormattedI8nText | undefined
  textFromStructure?: I8nText | undefined
  valueYAML?: FormattedI8nTextValueYAML | undefined
  textYAML?: I8nTextYAML | undefined
  formattedTextYAML?: I8nTextYAML | undefined
  defaultLanguageYAML?: string | undefined
  otherLanguagesTextYAML?: I8nTextYAML | undefined
  otherLanguagesFormattedTextYAML?: I8nTextYAML | undefined
  xml?: string
}

export const formattedI8nTextFixtures: FormattedI8nTextFixture[] = [
  {
    name: "undefined",
    text: undefined,
    valueYAML: undefined,
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
    valueYAML: { Текст: "Поле" },
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
    valueYAML: { Форматированный: "Истина", Текст: "Поле" },
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
    valueYAML: { Текст: { en: "Field" } },
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
    valueYAML: { Форматированный: "Истина", Текст: { en: "Field" } },
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
    valueYAML: { Текст: { en: "Field" } },
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
    valueYAML: { Форматированный: "Истина", Текст: { en: "Field" } },
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
    valueYAML: { Текст: { ru: "Поле", en: "Field" } },
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
    valueYAML: { Форматированный: "Истина", Текст: { ru: "Поле", en: "Field" } },
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
    valueYAML: { Текст: "<Текст с экранированным символом>" },
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
    text: { formatted: true, items: { ru: "Тест экранирования: & < > \" ' ]]>" } },
    textFromStructure: { items: { ru: "Тест экранирования: & < > \" ' ]]>" } },
    valueYAML: { Форматированный: "Истина", Текст: "Тест экранирования: & < > \" ' ]]>" },
    textYAML: undefined,
    formattedTextYAML: "Тест экранирования: & < > \" ' ]]>",
    defaultLanguageYAML: "Тест экранирования: & < > \" ' ]]>",
    otherLanguagesTextYAML: undefined,
    otherLanguagesFormattedTextYAML: undefined,
    xml: `<Title formatted="true">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Тест экранирования: &amp; &lt; &gt; " ' ]]&gt;</v8:content>
	</v8:item>
</Title>`,
  },
]
