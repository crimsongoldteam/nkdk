import { describe, expect, it } from "vitest"

import { emptyMetadataRules } from "./definition/testSupport"
import { createRuleRegistrySet } from "./ruleRegistrySet"

describe("RuleRegistrySet.xmlAnomalies", () => {
  it("публикует скомпилированный нейтральный runtime", () => {
    const registry = createRuleRegistrySet({
      ...emptyMetadataRules,
      xmlAnomalies: [{
        kind: "important",
        boundary: { propertyType: "SyntheticValue" },
      }],
    })

    expect(registry.xmlAnomalies.requiresImportant({
      itemType: "AnyOwner",
      propertyKey: "anyProperty",
      propertyType: "SyntheticValue",
    })).toBe(true)
  })

  it("отклоняет неоднозначные type и item/property регистрации при сборке", () => {
    expect(() => createRuleRegistrySet({
      ...emptyMetadataRules,
      metadataItems: {
        SyntheticOwner: {
          itemType: "SyntheticOwner",
          properties: {
            value: { type: "SyntheticValue", yaml: "Значение" },
          },
        },
      },
      xmlAnomalies: [
        {
          kind: "important",
          boundary: { propertyType: "SyntheticValue" },
        },
        {
          kind: "hiddenSingletonName",
          boundary: { itemType: "SyntheticOwner", propertyKey: "value" },
        },
      ],
    })).toThrow(/неоднознач.*SyntheticOwner\.value/i)
  })
})
