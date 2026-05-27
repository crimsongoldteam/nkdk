import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { AccountingFlagRules, ExtDimensionAccountingFlagRules } from "../accountingFlag/rules"

describe("metadata register field YAML import", () => {
  it.each([
    ["AccountingFlag", AccountingFlagRules],
    ["ExtDimensionAccountingFlag", ExtDimensionAccountingFlagRules],
  ] as const)("restores omitted synonym from name for %s", (_label, rule) => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule,
      name: "УчетПоПодразделениям",
      yaml: {
        Тип: "Булево",
      },
    })

    expect(result).toMatchObject({
      itemType: rule.itemType,
      synonym: { items: { ru: "Учет по подразделениям" } },
      type: { type: ["boolean"] },
    })
  })
})
