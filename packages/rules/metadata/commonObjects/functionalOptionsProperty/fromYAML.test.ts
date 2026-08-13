import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../ruleRuntime"
import { testAtomicFromYAML } from "../../../tests/property/atomicFromYAML"
import "./fromYAML"

const rule: PropertyRule = {
  type: "FunctionalOptionsProperty",
  yaml: "ФункциональныеОпции",
  metadataTarget: { kind: "object", roots: ["FunctionalOption"] },
}

describe("importFunctionalOptionsFromYAML", () => {
  it("imports empty item as explicit empty string", () => {
    const result = testAtomicFromYAML({
      rule,
      value: [""],
    })

    expect(result).toEqual([""])
  })


  it("restores short functional option names", () => {
    const result = testAtomicFromYAML({ rule, value: ["Булево"] })

    expect(result).toEqual(["FunctionalOption.Булево"])
  })
})
