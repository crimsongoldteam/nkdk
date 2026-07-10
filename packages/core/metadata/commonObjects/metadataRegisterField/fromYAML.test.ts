import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "../../orchestration"
import { importPropertyFromYAML } from "../../orchestration/property/fromYAML"
import { mockContext } from "../../../tests/mockContext"
import { AccountingFlagRules, ExtDimensionAccountingFlagRules } from "../accountingFlag/rules"
import { MetadataRegisterDimensionRules } from "../metadataRegisterDimension/rules"
import "../metadataRegisterDimension/register"
import { MetadataRegisterResourceRules } from "../metadataRegisterResource/rules"
import "../metadataRegisterResource/register"

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

  it("keeps empty source synonym for object YAML register field", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule: AccountingFlagRules,
      name: "УдалитьОКТМО_КПП",
      yaml: {
        Тип: "Строка(21)",
      },
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
  ] as const)("restores omitted synonym from name for object %s", (_label, rule) => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule,
      name: "ПризнакУчетаПоУмолчанию",
      yaml: {
        Тип: "Булево",
      },
    })

    expect(result).toMatchObject({
      itemType: rule.itemType,
      synonym: { items: { ru: "Признак учета по умолчанию" } },
      type: { type: ["boolean"] },
    })
  })

  it("rejects scalar YAML register field", () => {
    expect(() =>
      importMetadataItemFromYAML({
        context: mockContext,
        rule: AccountingFlagRules,
        name: "ПризнакУчетаПоУмолчанию",
        yaml: "Булево" as never,
      })
    ).toThrow("AccountingFlag: ожидался YAML-объект")
  })

  it("keeps empty source synonym for object YAML register dimension collection", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: { type: "MetadataRegisterDimensions" },
      value: {
        УдалитьОКТМО_КПП: {
          Тип: "Строка(21)",
        },
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
    expect(result[0]).toHaveProperty("synonym", { items: {} })
  })

  it("keeps empty source synonym for full YAML register resource collection", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: { type: "MetadataRegisterResources" },
      value: {
        Содержание: {
          Тип: "Строка(100)",
        },
      },
      sourceValue: [
        {
          itemType: MetadataRegisterResourceRules.itemType,
          name: "Содержание",
          synonym: { items: {} },
        },
      ],
    })

    expect(result).toEqual([
      expect.objectContaining({
        itemType: MetadataRegisterResourceRules.itemType,
        name: "Содержание",
        synonym: { items: {} },
        type: expect.objectContaining({
          type: ["string"],
          stringQualifiers: expect.objectContaining({ length: 100 }),
        }),
      }),
    ])
  })

  it("keeps empty source synonym for full YAML register dimension collection", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: { type: "MetadataRegisterDimensions" },
      value: {
        Организация: {
          Тип: "СправочникСсылка.Организации",
        },
      },
      sourceValue: [
        {
          itemType: MetadataRegisterDimensionRules.itemType,
          name: "Организация",
          synonym: { items: {} },
        },
      ],
    })

    expect(result).toEqual([
      expect.objectContaining({
        itemType: MetadataRegisterDimensionRules.itemType,
        name: "Организация",
        synonym: { items: {} },
      }),
    ])
  })

  it("restores omitted synonym from name for object YAML register resource collection without source", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: { type: "MetadataRegisterResources" },
      value: {
        Содержание: {
          Тип: "Строка(100)",
        },
      },
    })

    expect(result).toEqual([
      expect.objectContaining({
        itemType: MetadataRegisterResourceRules.itemType,
        name: "Содержание",
        synonym: { items: { ru: "Содержание" } },
        type: expect.objectContaining({
          type: ["string"],
          stringQualifiers: expect.objectContaining({ length: 100 }),
        }),
      }),
    ])
  })

  it("restores omitted synonym from name for full YAML register resource collection without source", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: { type: "MetadataRegisterResources" },
      value: {
        Содержание: {
          Тип: "Строка(100)",
        },
      },
    })

    expect(result).toEqual([
      expect.objectContaining({
        itemType: MetadataRegisterResourceRules.itemType,
        name: "Содержание",
        synonym: { items: { ru: "Содержание" } },
        type: expect.objectContaining({
          type: ["string"],
          stringQualifiers: expect.objectContaining({ length: 100 }),
        }),
      }),
    ])
  })

  it("restores omitted synonym from name for object YAML register dimension collection without source", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: { type: "MetadataRegisterDimensions" },
      value: {
        Организация: {
          Тип: "СправочникСсылка.Организации",
        },
      },
    })

    expect(result).toEqual([
      expect.objectContaining({
        itemType: MetadataRegisterDimensionRules.itemType,
        name: "Организация",
        synonym: { items: { ru: "Организация" } },
      }),
    ])
  })

  it("restores omitted synonym from name for full YAML register dimension collection without source", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: { type: "MetadataRegisterDimensions" },
      value: {
        Организация: {
          Тип: "СправочникСсылка.Организации",
        },
      },
    })

    expect(result).toEqual([
      expect.objectContaining({
        itemType: MetadataRegisterDimensionRules.itemType,
        name: "Организация",
        synonym: { items: { ru: "Организация" } },
      }),
    ])
  })
})
