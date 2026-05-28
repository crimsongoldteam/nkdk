import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { importPropertyFromYAML } from "~/metadata/orchestration/property/fromYAML"
import { mockContext } from "~/tests/mockContext"
import { AccountingFlagRules, ExtDimensionAccountingFlagRules } from "../accountingFlag/rules"
import { MetadataRegisterDimensionRules } from "../metadataRegisterDimension/rules"
import "../metadataRegisterDimension/register"

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

  it("keeps empty source synonym for short YAML register field", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule: AccountingFlagRules,
      name: "УдалитьОКТМО_КПП",
      yaml: "Строка(21)",
      source: {
        itemType: AccountingFlagRules.itemType,
        name: "УдалитьОКТМО_КПП",
        synonym: { items: {} },
      },
    })

    expect(result).toMatchObject({
      itemType: AccountingFlagRules.itemType,
      synonym: { items: {} },
      type: { type: ["string"], stringQualifiers: { length: 21 } },
    })
  })

  it.each([
    ["AccountingFlag", AccountingFlagRules],
    ["ExtDimensionAccountingFlag", ExtDimensionAccountingFlagRules],
  ] as const)("restores omitted synonym from name for short %s", (_label, rule) => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule,
      name: "ПризнакУчетаПоУмолчанию",
      yaml: "Булево",
    })

    expect(result).toMatchObject({
      itemType: rule.itemType,
      synonym: { items: { ru: "Признак учета по умолчанию" } },
      type: { type: ["boolean"] },
    })
  })

  it("keeps empty source synonym for short YAML register dimension collection", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: { type: "MetadataRegisterDimensions" },
      value: {
        УдалитьОКТМО_КПП: "Строка(21)",
      },
      sourceValue: [
        {
          itemType: MetadataRegisterDimensionRules.itemType,
          name: "УдалитьОКТМО_КПП",
          synonym: { items: {} },
        },
      ],
    })

    expect(result).toEqual([
      expect.objectContaining({
        itemType: MetadataRegisterDimensionRules.itemType,
        name: "УдалитьОКТМО_КПП",
        type: expect.objectContaining({
          type: ["string"],
          stringQualifiers: expect.objectContaining({ length: 21 }),
        }),
      }),
    ])
    expect(result[0]).not.toHaveProperty("synonym")
  })
})
