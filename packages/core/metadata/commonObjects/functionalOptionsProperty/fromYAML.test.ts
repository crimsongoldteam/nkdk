import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import "./fromYAML"

const rule: PropertyRule = {
  type: "FunctionalOptionsProperty",
  yaml: "ФункциональныеОпции",
}

describe("importFunctionalOptionsFromYAML", () => {
  it("imports empty item as explicit empty string", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: [""],
    })

    expect(result).toEqual([""])
  })
})
