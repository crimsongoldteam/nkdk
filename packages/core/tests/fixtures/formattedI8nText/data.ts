import { FormattedI8nText, FormattedI8nTextEnterprise } from "~/metadata/commonObjects/formattedI8nText/types"

export interface FormattedI8nTextFixture {
  name: string
  text: FormattedI8nText | undefined
  enterpriseText?: FormattedI8nTextEnterprise | undefined
  enterpriseFormattedText?: FormattedI8nTextEnterprise | undefined
  xml?: string
}

export const formattedI8nTextFixtures: FormattedI8nTextFixture[] = [
  {
    name: "undefined",
    text: undefined,
    enterpriseText: undefined,
    enterpriseFormattedText: undefined,
  },
  {
    name: "only default language with formatted false",
    text: { formatted: false, items: { ru: "Поле" } },
    enterpriseText: "Поле",
    enterpriseFormattedText: undefined,
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
    enterpriseText: "Поле",
    enterpriseFormattedText: "Поле",
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
    enterpriseText: { en: "Field" },
    enterpriseFormattedText: { en: "Field" },
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
    enterpriseText: { en: "Field" },
    enterpriseFormattedText: { en: "Field" },
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
    enterpriseText: { ru: "Поле", en: "Field" },
    enterpriseFormattedText: undefined,
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
    enterpriseText: { ru: "Поле", en: "Field" },
    enterpriseFormattedText: { ru: "Поле", en: "Field" },
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
    enterpriseText: "<Текст с экранированным символом>",
    enterpriseFormattedText: undefined,
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
    enterpriseText: "<Текст с экранированным символом>",
    enterpriseFormattedText: "<Текст с экранированным символом>",
    xml: `<Title formatted="true">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>&lt;Текст с экранированным символом&gt;</v8:content>
	</v8:item>
</Title>`,
  },
]
