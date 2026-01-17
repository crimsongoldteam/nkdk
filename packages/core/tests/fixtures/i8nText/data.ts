import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"

export interface I8nTextFixture {
  name: string
  text: I8nText | undefined
  textFromStructure?: I8nText | undefined
  enterpriseFull?: I8nTextEnterprise | undefined
  enterpriseDefaultLanguage?: string | undefined
  enterpriseOtherLanguages?: I8nTextEnterprise | undefined
  xml?: string
}

export const i8nTextFixtures: I8nTextFixture[] = [
  {
    name: "undefined",
    text: undefined,
    textFromStructure: undefined,
    enterpriseFull: undefined,
    enterpriseDefaultLanguage: undefined,
    enterpriseOtherLanguages: undefined,
  },
  {
    name: "only default language",
    text: { items: { ru: "Поле" } },
    textFromStructure: { items: { ru: "Поле" } },
    enterpriseFull: "Поле",
    enterpriseDefaultLanguage: "Поле",
    enterpriseOtherLanguages: undefined,
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
    enterpriseFull: { en: "Field" },
    enterpriseDefaultLanguage: undefined,
    enterpriseOtherLanguages: { en: "Field" },
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
    enterpriseFull: { en: "Field", de: "Feld" },
    enterpriseDefaultLanguage: undefined,
    enterpriseOtherLanguages: { en: "Field", de: "Feld" },
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
    enterpriseFull: { ru: "Поле", en: "Field" },
    enterpriseDefaultLanguage: "Поле",
    enterpriseOtherLanguages: { en: "Field" },
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
    enterpriseFull: { ru: "Поле", en: "Field" },
    enterpriseDefaultLanguage: "Поле",
    enterpriseOtherLanguages: { en: "Field" },
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
    enterpriseFull: { en: "Поле" },
    enterpriseDefaultLanguage: undefined,
    enterpriseOtherLanguages: { en: "Поле" },
    xml: `<Title>
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
</Title>`,
  },
  {
    name: "with escaped content",
    text: { items: { ru: "<Текст с экранированным символом>" } },
    textFromStructure: { items: { ru: "<Текст с экранированным символом>" } },
    enterpriseFull: "<Текст с экранированным символом>",
    enterpriseDefaultLanguage: "<Текст с экранированным символом>",
    enterpriseOtherLanguages: undefined,
    xml: `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>&lt;Текст с экранированным символом&gt;</v8:content>
	</v8:item>
</Title>`,
  },
]
