import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { fullAvailableFields, fullAvailableFieldsYAML } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AvailableFields",
}

describe("import AvailableFields from YAML", () => {
  it("imports full YAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fullAvailableFieldsYAML,
    })

    expect(result).toEqual(fullAvailableFields)
  })
})
