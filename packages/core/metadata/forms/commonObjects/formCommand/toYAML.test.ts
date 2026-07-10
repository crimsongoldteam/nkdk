import { describe, expect, it } from "vitest"
import {
  fullFormCommands,
  fullFormCommandsYAML,
  minimalFormCommandYAML,
  minimalFormCommands,
} from "./__fixtures__/data"
import { exportPropertyToYAML, PropertyRule } from "../../../orchestration"
import { mockContext } from "../../../../tests/mockContext"
import { testExportPropertyToYAML } from "../../../../tests/property/exportPropertyToYAML"

import "./types"

const rule: PropertyRule = {
  type: "FormCommands",
  yaml: "Команды",
  defaultValue: [],
}

describe("export FormCommands to YAML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should export full to YAML", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: fullFormCommands,
    })

    expect(result).toEqual({ Команды: fullFormCommandsYAML })
  })

  it("should export minimal", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: minimalFormCommands,
    })

    expect(result).toEqual({ Команды: minimalFormCommandYAML })
  })
})
