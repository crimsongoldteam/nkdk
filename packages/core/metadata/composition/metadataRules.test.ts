import { describe, expect, it } from "vitest"

import { typeRulesRegistryRevision } from "../ruleRuntime/property/typeRuleRegistry"

describe("metadataRules", () => {
  it(
    "exports property rules without writing to the legacy registry",
    async () => {
      const revisionBeforeImport = typeRulesRegistryRevision()

      const { metadataRules } = await import("./metadataRules")

      expect(typeRulesRegistryRevision()).toBe(revisionBeforeImport)
      expect(metadataRules.propertyTypes.dateTime?.importFromXML).toBeTypeOf(
        "function",
      )
      expect(metadataRules.propertyTypes.dateTime?.exportToXML).toBeTypeOf(
        "function",
      )
    },
    30_000,
  )
})
