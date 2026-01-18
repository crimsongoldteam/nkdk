import { FormattedI8nText, FormattedI8nTextEnterprise } from "~/metadata/commonObjects/formattedI8nText/types"
import { I8nText } from "~/metadata/commonObjects/i8nText/types"

export interface FormattedI8nTextFixture {
  name: string
  text: FormattedI8nText | undefined
  textFromStructure?: I8nText | undefined
  enterpriseText?: FormattedI8nTextEnterprise | undefined
  enterpriseFormattedText?: FormattedI8nTextEnterprise | undefined
  enterpriseDefaultLanguage?: string | undefined
  enterpriseOtherLanguagesText?: FormattedI8nTextEnterprise | undefined
  enterpriseOtherLanguagesFormattedText?: FormattedI8nTextEnterprise | undefined
  xml?: string
}

export const formattedI8nTextFixtures: FormattedI8nTextFixture[] = [
  {
    name: "undefined",
    text: undefined,
    enterpriseText: undefined,
    enterpriseFormattedText: undefined,
    enterpriseDefaultLanguage: undefined,
    enterpriseOtherLanguagesText: undefined,
    enterpriseOtherLanguagesFormattedText: undefined,
  },
  {
    name: "only default language with formatted false",
    text: { formatted: false, items: { ru: "Поле" } },
    textFromStructure: { items: { ru: "Поле" } },
    enterpriseText: "Поле",
    enterpriseFormattedText: undefined,
    enterpriseDefaultLanguage: "Поле",
    enterpriseOtherLanguagesText: undefined,
    enterpriseOtherLanguagesFormattedText: undefined,
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
    enterpriseText: undefined,
    enterpriseFormattedText: "Поле",
    enterpriseDefaultLanguage: "Поле",
    enterpriseOtherLanguagesText: undefined,
    enterpriseOtherLanguagesFormattedText: undefined,
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
    enterpriseText: { en: "Field" },
    enterpriseFormattedText: undefined,
    enterpriseDefaultLanguage: undefined,
    enterpriseOtherLanguagesText: { en: "Field" },
    enterpriseOtherLanguagesFormattedText: undefined,
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
    enterpriseText: undefined,
    enterpriseFormattedText: { en: "Field" },
    enterpriseDefaultLanguage: undefined,
    enterpriseOtherLanguagesText: undefined,
    enterpriseOtherLanguagesFormattedText: { en: "Field" },
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
    enterpriseText: { en: "Field" },
    enterpriseFormattedText: undefined,
    enterpriseDefaultLanguage: undefined,
    enterpriseOtherLanguagesText: { en: "Field" },
    enterpriseOtherLanguagesFormattedText: undefined,
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
    enterpriseText: undefined,
    enterpriseFormattedText: { en: "Field" },
    enterpriseDefaultLanguage: undefined,
    enterpriseOtherLanguagesText: undefined,
    enterpriseOtherLanguagesFormattedText: { en: "Field" },
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
    enterpriseText: { ru: "Поле", en: "Field" },
    enterpriseFormattedText: undefined,
    enterpriseDefaultLanguage: "Поле",
    enterpriseOtherLanguagesText: { en: "Field" },
    enterpriseOtherLanguagesFormattedText: undefined,
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
    enterpriseText: undefined,
    enterpriseFormattedText: { ru: "Поле", en: "Field" },
    enterpriseDefaultLanguage: "Поле",
    enterpriseOtherLanguagesText: undefined,
    enterpriseOtherLanguagesFormattedText: { en: "Field" },
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
    enterpriseText: "<Текст с экранированным символом>",
    enterpriseFormattedText: undefined,
    enterpriseDefaultLanguage: "<Текст с экранированным символом>",
    enterpriseOtherLanguagesText: undefined,
    enterpriseOtherLanguagesFormattedText: undefined,
    xml: `<Title formatted="false">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>&lt;Текст с экранированным символом&gt;</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "with escaped content and formatted true",
    text: { formatted: true, items: { ru: "<Текст с экранированным символом>" } },
    textFromStructure: { items: { ru: "<Текст с экранированным символом>" } },
    enterpriseText: undefined,
    enterpriseFormattedText: "<Текст с экранированным символом>",
    enterpriseDefaultLanguage: "<Текст с экранированным символом>",
    enterpriseOtherLanguagesText: undefined,
    enterpriseOtherLanguagesFormattedText: undefined,
    xml: `<Title formatted="true">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>&lt;Текст с экранированным символом&gt;</v8:content>
	</v8:item>
</Title>`,
  },
]
