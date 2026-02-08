import { describe, expect, it } from "vitest"
import { exportPropertyToYAML } from "~/metadata/metadataFactory"
import {
  fullAutoCommandBar,
  fullAutoExportCommandBarEnterprise,
  minimalAutoCommandBar,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { Table } from "../table/types"
import { exportAutoCommandBarToEnterprise } from "./toYAML"

const rule = { type: "AutoCommandBar", yaml: "КоманднаяПанель" }

describe("exportAutoCommandBarToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule: rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportPropertyToYAML<Table>({
      context: mockContext,
      rule: rule,
      value: fullAutoCommandBar,
    })

    expect(result).toEqual(fullAutoExportCommandBarEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPropertyToYAML<Table>({
      context: mockContext,
      rule: rule,
      value: fullAutoCommandBar,
    })
    const result = exportAutoCommandBarToEnterprise(mockContext, mockRule, minimalAutoCommandBar)

    expect(result).toBeUndefined()
  })
})
