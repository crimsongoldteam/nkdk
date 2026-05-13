import { describe, expect, it } from "vitest"
import { TopLevelMetadataItemRules } from "./topLevelRules"

describe("TopLevelMetadataItemRules", () => {
  it("includes simple applied objects used by configuration sync", () => {
    const rules = TopLevelMetadataItemRules.map((rule) => ({
      itemType: rule.itemType,
      xmlDir: rule.xmlDir,
    }))

    expect(rules).toEqual(
      expect.arrayContaining([
        { itemType: "MetadataDefinedType", xmlDir: "DefinedTypes" },
        { itemType: "MetadataSessionParameter", xmlDir: "SessionParameters" },
        { itemType: "MetadataEventSubscription", xmlDir: "EventSubscriptions" },
        { itemType: "MetadataFunctionalOptionsParameter", xmlDir: "FunctionalOptionsParameters" },
        { itemType: "MetadataStyleItem", xmlDir: "StyleItems" },
      ])
    )
  })
})
