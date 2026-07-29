import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { MetadataAccountingRegisterRules } from "../appliedObjects/metadataAccountingRegister/rules"
import { MetadataChartOfAccountsRules } from "../appliedObjects/metadataChartOfAccounts/rules"
import { MetadataDataProcessorRules } from "../appliedObjects/metadataDataProcessor/rules"
import { MetadataReportRules } from "../appliedObjects/metadataReport/rules"
import {
  MetadataAttributesWithAllowedTypesRules,
  MetadataCatalogAttributeRules,
} from "../commonObjects/metadataAttribute/rules"
import { MetadataExternalDataSourceCubeCollectionRules } from "../commonObjects/metadataExternalDataSourceCube/rules"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"
import { buildRuntimeRuleOrderCatalog } from "./catalog"

const metadataDir = join(dirname(fileURLToPath(import.meta.url)), "..")

describe("buildRuntimeRuleOrderCatalog", () => {
  it("distinguishes structurally equal exports by runtime identity", async () => {
    const catalog = await buildRuntimeRuleOrderCatalog({ metadataDir })

    expect(catalog.sourceOf(MetadataAttributesWithAllowedTypesRules)?.candidate).toBe(
      "commonObjects/metadataAttribute/rules.ts#MetadataAttributesWithAllowedTypesRules"
    )
    expect(catalog.sourceOf(MetadataCatalogAttributeRules)?.candidate).toBe(
      "commonObjects/metadataAttribute/rules.ts#MetadataCatalogAttributeRules"
    )
  })

  it("does not fall back to itemType for an unexported object", async () => {
    const catalog = await buildRuntimeRuleOrderCatalog({ metadataDir })
    const copy = {
      ...MetadataCatalogAttributeRules,
      properties: { ...MetadataCatalogAttributeRules.properties },
    }

    expect(catalog.sourceOf(copy)).toBeUndefined()
  })

  it("indexes a static nested item rule through its exported parent", async () => {
    const catalog = await buildRuntimeRuleOrderCatalog({ metadataDir })
    const nestedRule = MetadataDataProcessorRules.properties.attributes.itemRule
    expect(nestedRule).toBeDefined()

    expect(catalog.sourceOf(nestedRule!)).toMatchObject({
      filePath: join(metadataDir, "appliedObjects/metadataDataProcessor/rules.ts"),
      exportName: "MetadataDataProcessorRules",
      propertyPath: ["properties", "attributes", "itemRule"],
    })
  })

  it("indexes a child collection item rule through its concrete owner", async () => {
    const catalog = await buildRuntimeRuleOrderCatalog({ metadataDir })
    const commandRule = MetadataAccountingRegisterRules.childCollections?.[0]?.itemRule
    expect(commandRule).toBeDefined()

    expect(catalog.sourceOf(commandRule!)).toMatchObject({
      filePath: join(metadataDir, "appliedObjects/metadataAccountingRegister/rules.ts"),
      exportName: "MetadataAccountingRegisterRules",
      propertyPath: ["childCollections", "0", "itemRule"],
    })
  })

  it("does not index reusable property fragments as rules", async () => {
    const catalog = await buildRuntimeRuleOrderCatalog({ metadataDir })

    expect(catalog.sources().map(({ candidate }) => candidate)).not.toContain(
      "forms/elements/formGroup/rules.ts#formGroupCommonProperties"
    )
  })

  it("chooses the nearest exported owner for a reused nested rule", async () => {
    const catalog = await buildRuntimeRuleOrderCatalog({ metadataDir })
    const nestedRule = MetadataExternalDataSourceCubeCollectionRules.childCollections?.[0]?.itemRule
    expect(nestedRule).toBeDefined()

    expect(catalog.sourceOf(nestedRule!)?.candidate).toBe(
      "commonObjects/metadataExternalDataSourceDimensionTable/rules.ts#MetadataExternalDataSourceDimensionTableCollectionRules"
    )
    expect(catalog.ambiguities()).toEqual([])
  })

  it("сопоставляет зарегистрированное правило реквизита отчёта", async () => {
    const catalog = await buildRuntimeRuleOrderCatalog({ metadataDir })
    const nested = getTypeRule("MetadataReportAttributes", "nestedItemRule")
    if (nested === undefined || !("itemRule" in nested)) {
      throw new Error("Не найдено правило реквизита отчёта")
    }

    expect(catalog.sourceOf(nested.itemRule)?.candidate).toBe(
      "appliedObjects/metadataReport/rules.ts#MetadataReportAttributeRules"
    )
    expect(
      "itemRule" in MetadataReportRules.properties.attributes
        ? MetadataReportRules.properties.attributes.itemRule
        : undefined
    ).toBe(nested.itemRule)
  })

  it("сопоставляет вложенные правила предопределённых счетов", async () => {
    const catalog = await buildRuntimeRuleOrderCatalog({ metadataDir })
    const accountingFlags = getTypeRule("ChartOfAccountsPredefinedAccountingFlags", "nestedItemRule")
    const extDimensionTypes = getTypeRule("ChartOfAccountsPredefinedExtDimensionTypes", "nestedItemRule")
    if (accountingFlags === undefined || !("itemRule" in accountingFlags)) {
      throw new Error("Не найдено правило признака учёта")
    }
    if (extDimensionTypes === undefined || !("itemRule" in extDimensionTypes)) {
      throw new Error("Не найдено правило вида субконто")
    }

    expect(catalog.sourceOf(accountingFlags.itemRule)?.candidate).toBe(
      "appliedObjects/metadataChartOfAccounts/predefined/rules.ts#PredefinedAccountingFlagRules"
    )
    expect(catalog.sourceOf(extDimensionTypes.itemRule)?.candidate).toBe(
      "appliedObjects/metadataChartOfAccounts/predefined/rules.ts#PredefinedExtDimensionTypeRules"
    )
    expect(MetadataChartOfAccountsRules.properties.predefined.itemRule).toBeDefined()
  })

  it("перечисляет все конкретные источники без дубликатов и в стабильном порядке", async () => {
    const catalog = await buildRuntimeRuleOrderCatalog({ metadataDir })
    const candidates = catalog.sources().map((source) => source.candidate)

    expect(candidates).toContain("forms/elements/usualGroup/rules.ts#UsualGroupRules")
    expect(candidates).toEqual([...new Set(candidates)])
    expect(candidates).toEqual([...candidates].sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right))))
  })
})
