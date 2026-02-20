import { describe, expect, it } from "vitest"
import { exportPropertyToYAML } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import {
  fullAutoCommandBar,
  fullAutoExportCommandBarYAML,
  minimalAutoCommandBar,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext } from "~/tests/mockContext"
import { Table } from "../table/types"

const rule: PropertyRule<Table> = { type: "AutoCommandBar", yaml: "КоманднаяПанель", toEnt: false }

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
    const result = exportPropertyToYAML<Table>({
      context: mockContext,
      rule: rule,
      value: fullAutoCommandBar,
    })

    expect(result).toHaveProperty("КоманднаяПанель", fullAutoExportCommandBarYAML)
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
