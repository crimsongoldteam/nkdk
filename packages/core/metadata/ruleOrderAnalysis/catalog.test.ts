import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { MetadataDataProcessorRules } from "../appliedObjects/metadataDataProcessor/rules"
import {
  MetadataAttributesWithAllowedTypesRules,
  MetadataCatalogAttributeRules,
} from "../commonObjects/metadataAttribute/rules"
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

  it("перечисляет все конкретные источники без дубликатов и в стабильном порядке", async () => {
    const catalog = await buildRuntimeRuleOrderCatalog({ metadataDir })
    const candidates = catalog.sources().map((source) => source.candidate)

    expect(candidates).toContain("forms/elements/usualGroup/rules.ts#UsualGroupRules")
    expect(candidates).toEqual([...new Set(candidates)])
    expect(candidates).toEqual([...candidates].sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right))))
  })
})
