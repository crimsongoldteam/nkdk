import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../orchestration"
import { testAtomicFromYAML } from "../../../tests/property/atomicFromYAML"
import "./fromYAML"

const rule: PropertyRule = {
  type: "FunctionalOptionsProperty",
  yaml: "ФункциональныеОпции",
}

describe("importFunctionalOptionsFromYAML", () => {
  it("imports empty item as explicit empty string", () => {
    const result = testAtomicFromYAML({
      rule,
      value: [""],
    })

    expect(result).toEqual([""])
  })
})
