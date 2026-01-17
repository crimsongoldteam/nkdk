import { FormattedI8nTextEnterprise } from "~/metadata/commonObjects/formattedI8nText/types"
import { FormattedI8nText } from "~/metadata/commonObjects/i8nText/types"
import { combinedI8nTextFixtures as baseCombinedI8nTextFixtures } from "../i8nText/data"

export const formattedWithNonEmptyDefaultI8nText: FormattedI8nText = { formatted: true, items: { ru: "Поле" } }

export const formattedWithEmptyDefaultI8nText: FormattedI8nText = { formatted: true, items: { ru: "" } }

export interface CombinedI8nTextFixture {
  name: string
  defaultLanguage: FormattedI8nText | undefined
  otherLanguagesEnterprise: FormattedI8nTextEnterprise | undefined
  expectedResult: FormattedI8nText | undefined
  expectedDefaultExport: string | undefined
  expectedOtherExport: FormattedI8nTextEnterprise | undefined
  fullI8nText?: FormattedI8nText
}

const convertToFormatted = <T extends { items: Record<string, string> } | undefined>(
  value: T
): T extends { items: Record<string, string> } ? FormattedI8nText : undefined => {
  if (!value) return undefined as any
  return { formatted: false, ...value } as any
}

export const formattedI8nTextFixtures: CombinedI8nTextFixture[] = [
  ...baseCombinedI8nTextFixtures.map(
    (fixture): CombinedI8nTextFixture => ({
      ...fixture,
      defaultLanguage: convertToFormatted(fixture.defaultLanguage),
      expectedResult: convertToFormatted(fixture.expectedResult),
      fullI8nText: fixture.fullI8nText ? convertToFormatted(fixture.fullI8nText) : undefined,
    })
  ),
  {
    name: "с formatted в defaultLanguage",
    defaultLanguage: { formatted: true, items: { ru: "Поле" } },
    otherLanguagesEnterprise: { en: "Field" },
    expectedResult: { formatted: true, items: { ru: "Поле", en: "Field" } },
    expectedDefaultExport: "Поле",
    expectedOtherExport: { en: "Field" },
    fullI8nText: { formatted: true, items: { ru: "Поле", en: "Field" } },
  },
]
