import { describe,expect,it } from "vitest"
import { testAtomicFromYAML } from "../../../../tests/property/atomicFromYAML"
import { PropertyRule } from "../../../ruleRuntime"
import {
fullAvailableFields,
fullAvailableFieldsYAML,
selectedItemAvailableFields,
selectedItemAvailableFieldsYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AvailableFields",
}

describe("import available fields from YAML", () => {
  it("imports full YAML", () => {
    const result = testAtomicFromYAML({
      rule,
      value: fullAvailableFieldsYAML,
    })

    expect(result).toEqual(fullAvailableFields)
  })

  it("imports selected items", () => {
    const result = testAtomicFromYAML({
      rule,
      value: selectedItemAvailableFieldsYAML,
    })

    expect(result).toEqual(selectedItemAvailableFields)
  })

  it("imports item with only field as string", () => {
    const result = testAtomicFromYAML({
      rule,
      value: [{ Поле: "Документ" }],
    })

    expect(result).toEqual(["Документ"])
  })
})
