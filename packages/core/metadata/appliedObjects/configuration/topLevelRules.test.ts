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
        { itemType: "MetadataFilterCriterion", xmlDir: "FilterCriteria" },
        { itemType: "MetadataFunctionalOptionsParameter", xmlDir: "FunctionalOptionsParameters" },
        { itemType: "MetadataSettingsStorage", xmlDir: "SettingsStorages" },
        { itemType: "MetadataStyleItem", xmlDir: "StyleItems" },
        { itemType: "MetadataCommonAttribute", xmlDir: "CommonAttributes" },
        { itemType: "MetadataConstant", xmlDir: "Constants" },
        { itemType: "MetadataChartOfAccounts", xmlDir: "ChartsOfAccounts" },
        { itemType: "MetadataBot", xmlDir: "Bots" },
        { itemType: "MetadataWSReference", xmlDir: "WSReferences" },
        { itemType: "MetadataEnumeration", xmlDir: "Enums" },
        { itemType: "MetadataReport", xmlDir: "Reports" },
      ])
    )
  })
})
