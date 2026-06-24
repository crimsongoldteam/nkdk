import { describe, expect, it } from "vitest"
import {
  fullFormCommands,
  fullFormCommandsYAML,
  minimalFormCommandYAML,
  minimalFormCommandsImportedFromYAML,
} from "~/metadata/forms/commonObjects/formCommand/__fixtures__/data"
import { importPropertyFromYAML, PropertyRule } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"

import "./types"

const rule: PropertyRule = {
  type: "FormCommands",
  yaml: "Команды",
  defaultValue: [],
}

describe("import FormCommands from YAML", () => {
  it("should return empty array for undefined input", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule,
      value: undefined,
    })

    expect(result).toEqual([])
  })

  it("should import full from YAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fullFormCommandsYAML,
    })

    expect(result).toEqual(fullFormCommands)
  })

  it("should import minimal from YAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: minimalFormCommandYAML,
    })

    expect(result).toEqual(minimalFormCommandsImportedFromYAML)
  })
})
