import { describe, expect, it } from "vitest"
import { MetadataAccountingRegisterRules } from "./metadataAccountingRegister/rules"
import { MetadataCalculationRegisterRules } from "./metadataCalculationRegister/rules"
import { MetadataChartOfAccountsRules } from "./metadataChartOfAccounts/rules"
import { MetadataChartOfCalculationTypesRules } from "./metadataChartOfCalculationTypes/rules"
import { MetadataChartOfCharacteristicTypesRules } from "./metadataChartOfCharacteristicTypes/rules"

const task7Rules = [
  MetadataAccountingRegisterRules,
  MetadataCalculationRegisterRules,
  MetadataChartOfAccountsRules,
  MetadataChartOfCalculationTypesRules,
  MetadataChartOfCharacteristicTypesRules,
]

describe("Task 7 applied object rules", () => {
  it("use Макеты as nkdk folder for child templates", () => {
    for (const rule of task7Rules) {
      expect(rule.properties.templates).toMatchObject({ folderName: "Макеты" })
    }
  })

  it("use Predefined helper for chart predefined data", () => {
    expect(MetadataChartOfAccountsRules.properties.predefined).toMatchObject({
      type: "Predefined",
      filePath: "Ext/Predefined.xml",
    })
    expect(MetadataChartOfCalculationTypesRules.properties.predefined).toMatchObject({
      type: "Predefined",
      filePath: "Ext/Predefined.xml",
    })
    expect(MetadataChartOfCharacteristicTypesRules.properties.predefined).toMatchObject({
      type: "Predefined",
      filePath: "Ext/Predefined.xml",
    })
  })
})
