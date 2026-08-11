import { describe, expect, it } from "vitest"
import { getSystemEnumeration } from "./systemEnumerationRegistry"
import { createPropertyRuleRegistrySet } from "./propertyRuleRegistrySet"
import { withPropertyRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { emptyMetadataRules } from "../definition/testSupport"

describe("system enumeration registry", () => {
  it("registers and resolves enumeration tables", () => {
    const value = {
      fromYAML: { Значение: "Value" },
      toYAML: { Value: "Значение" },
    } as const

    const registry = createPropertyRuleRegistrySet({
      ...emptyMetadataRules,
      systemEnumerations: { __registry_test__: value },
    })

    expect(withPropertyRuleRegistrySet(registry, () => getSystemEnumeration("__registry_test__"))).toBe(value)
  })

  it("does not resolve an enumeration outside its registry context", () => {
    expect(getSystemEnumeration("__registry_test__")).toBeUndefined()
  })
})
