import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { MetadataAttributeRules } from "../commonObjects/metadataAttribute/rules"
import { buildRuleOrderCatalog } from "./catalog"
import { fingerprintMetadataItemRule } from "./fingerprint"

const metadataDir = join(dirname(fileURLToPath(import.meta.url)), "..")

describe("buildRuleOrderCatalog", () => {
  it("indexes exported rules by file and export name", async () => {
    const catalog = await buildRuleOrderCatalog({ metadataDir })
    const observation = catalog.match({
      configuration: "all",
      sourceXmlPath: "/xml/Test.xml",
      logicalAddress: "Тест.Объект",
      xmlNodeLogicalAddress: "Тест.Объект",
      ruleId: fingerprintMetadataItemRule(MetadataAttributeRules),
      itemType: MetadataAttributeRules.itemType,
      fields: ["name"],
    })

    expect(observation?.ruleCandidates).toContain("commonObjects/metadataAttribute/rules.ts#MetadataAttributeRules")
  })

  it("returns undefined for a rule outside rules.ts", async () => {
    const catalog = await buildRuleOrderCatalog({ metadataDir })
    expect(
      catalog.match({
        configuration: "all",
        sourceXmlPath: "/xml/Test.xml",
        logicalAddress: "Тест.Объект",
        xmlNodeLogicalAddress: "Тест.Объект",
        ruleId: "unknown",
        itemType: "Unknown",
        fields: ["name"],
      })
    ).toBeUndefined()
  })

  it("falls back to itemType when a worker fingerprint differs", async () => {
    const catalog = await buildRuleOrderCatalog({ metadataDir })
    const observation = catalog.match({
      configuration: "all",
      sourceXmlPath: "/xml/Test.xml",
      logicalAddress: "Тест.Объект",
      xmlNodeLogicalAddress: "Тест.Объект",
      ruleId: "worker-specific-id",
      itemType: MetadataAttributeRules.itemType,
      fields: ["name"],
    })

    expect(observation?.ruleCandidates).toContain("commonObjects/metadataAttribute/rules.ts#MetadataAttributeRules")
  })
})
