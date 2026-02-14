import { describe, expect, it } from "vitest"
import { exportPropertyToYAML } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import {
  fullAutoCommandBar,
  fullAutoExportCommandBarEnterprise,
  minimalAutoCommandBar,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext } from "~/tests/mockContext"
import { Table } from "../table/types"

const rule: PropertyRule<Table> = { type: "AutoCommandBar", yaml: "КоманднаяПанель", toEnterprise: false }

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

    expect(result).toHaveProperty("КоманднаяПанель", fullAutoExportCommandBarEnterprise)
  })

  it("should export minimal", () => {
    const result = exportPropertyToYAML<Table>({
      context: mockContext,
      rule: rule,
      value: minimalAutoCommandBar,
    })

    expect(result).toBeUndefined()
  })
})
