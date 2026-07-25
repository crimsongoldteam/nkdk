import { describe, expect, it } from "vitest"
import { testAppliedObjectFromXMLToYAML } from "../../../tests/directConversion"
import { MetadataChartOfAccountsRules } from "./rules"

describe("MetadataChartOfAccounts XML → YAML", () => {
  it("выводит стандартные табличные части в YAML", () => {
    const imported = testAppliedObjectFromXMLToYAML({
      rule: MetadataChartOfAccountsRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(imported.yaml).toHaveProperty("СтандартныеТабличныеЧасти.ExtDimensionTypes")
  })
})
