import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"

export const withoutTextI8nText: I8nText = { items: { ru: "" } }

export const escapedContentI8nText: I8nText = { items: { ru: "<Текст с экранированным символом>" } }

export const escapedContentI8nTextEnterprise: I8nTextEnterprise = {
  ru: "<Текст с экранированным символом>",
}

export interface CombinedI8nTextFixture {
  name: string
  defaultLanguage: I8nText | undefined
  otherLanguagesEnterprise: I8nTextEnterprise | undefined
  expectedResult: I8nText | undefined
  expectedDefaultExport: string | undefined
  expectedOtherExport: I8nTextEnterprise | undefined
  // Для симметричных тестов: полный I8nText, который должен быть восстановлен после экспорта и импорта
  fullI8nText?: I8nText
}

export const combinedI8nTextFixtures: CombinedI8nTextFixture[] = [
  {
    name: "оба undefined",
    defaultLanguage: undefined,
    otherLanguagesEnterprise: undefined,
    expectedResult: undefined,
    expectedDefaultExport: undefined,
    expectedOtherExport: undefined,
  },
  {
    name: "только defaultLanguage",
    defaultLanguage: { items: { ru: "Поле" } },
    otherLanguagesEnterprise: undefined,
    expectedResult: { items: { ru: "Поле" } },
    expectedDefaultExport: "Поле",
    expectedOtherExport: undefined,
    fullI8nText: { items: { ru: "Поле" } },
  },
  {
    name: "только otherLanguagesEnterprise как объект с одним языком",
    defaultLanguage: undefined,
    otherLanguagesEnterprise: { en: "Field" },
    expectedResult: { items: { en: "Field" } },
    expectedDefaultExport: undefined,
    expectedOtherExport: undefined,
  },
  {
    name: "только otherLanguagesEnterprise как объект с несколькими языками",
    defaultLanguage: undefined,
    otherLanguagesEnterprise: { en: "Field", de: "Feld" },
    expectedResult: { items: { en: "Field", de: "Feld" } },
    expectedDefaultExport: undefined,
    expectedOtherExport: undefined,
  },
  {
    name: "оба параметра с одним языком",
    defaultLanguage: { items: { ru: "Поле" } },
    otherLanguagesEnterprise: { en: "Field" },
    expectedResult: { items: { ru: "Поле", en: "Field" } },
    expectedDefaultExport: "Поле",
    expectedOtherExport: { en: "Field" },
    fullI8nText: { items: { ru: "Поле", en: "Field" } },
  },
  {
    name: "оба параметра с несколькими языками",
    defaultLanguage: { items: { ru: "Поле" } },
    otherLanguagesEnterprise: { en: "Field", de: "Feld" },
    expectedResult: { items: { ru: "Поле", en: "Field", de: "Feld" } },
    expectedDefaultExport: "Поле",
    expectedOtherExport: { en: "Field", de: "Feld" },
    fullI8nText: { items: { ru: "Поле", en: "Field", de: "Feld" } },
  },
  {
    name: "с formatted в defaultLanguage",
    defaultLanguage: { formatted: true, items: { ru: "Поле" } },
    otherLanguagesEnterprise: { en: "Field" },
    expectedResult: { formatted: true, items: { ru: "Поле", en: "Field" } },
    expectedDefaultExport: "Поле",
    expectedOtherExport: { en: "Field" },
    fullI8nText: { formatted: true, items: { ru: "Поле", en: "Field" } },
  },
  {
    name: "defaultLanguage с несколькими языками, otherLanguagesEnterprise пустой",
    defaultLanguage: { items: { ru: "Поле", en: "Field" } },
    otherLanguagesEnterprise: {},
    expectedResult: { items: { ru: "Поле", en: "Field" } },
    expectedDefaultExport: "Поле",
    expectedOtherExport: { en: "Field" },
    fullI8nText: { items: { ru: "Поле", en: "Field" } },
  },
]
