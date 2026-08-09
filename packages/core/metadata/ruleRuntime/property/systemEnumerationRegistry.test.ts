import { describe, expect, it } from "vitest"
import { getSystemEnumeration, registerSystemEnumeration } from "./systemEnumerationRegistry"

describe("system enumeration registry", () => {
  it("registers and resolves enumeration tables", () => {
    const value = {
      fromYAML: { Значение: "Value" },
      toYAML: { Value: "Значение" },
    } as const

    registerSystemEnumeration("__registry_test__", value)

    expect(getSystemEnumeration("__registry_test__")).toBe(value)
  })

  it("rejects a conflicting registration", () => {
    registerSystemEnumeration("__duplicate_registry_test__", { fromYAML: {}, toYAML: {} })

    expect(() =>
      registerSystemEnumeration("__duplicate_registry_test__", {
        fromYAML: { Другое: "Other" },
        toYAML: { Other: "Другое" },
      })
    ).toThrow("System enumeration __duplicate_registry_test__ is already registered")
  })
})
