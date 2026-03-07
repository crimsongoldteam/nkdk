import { describe, expect, it } from "vitest"
import { exportPropertyToYAML } from "~/metadata/orchestration"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import {
  fullAutoCommandBar,
  fullAutoExportCommandBarYAML,
  minimalAutoCommandBar,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule = { type: "AutoCommandBar", yaml: "КоманднаяПанель", toEnterprise: false }

describe("exportAutoCommandBarToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule: rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should export all fields to YAML", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule: rule,
      value: fullAutoCommandBar,
    })

    expect(result).toHaveProperty("КоманднаяПанель", fullAutoExportCommandBarYAML)
  })

  it("should export minimal", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule: rule,
      value: minimalAutoCommandBar,
    })

    expect(result).toBeUndefined()
  })
})
