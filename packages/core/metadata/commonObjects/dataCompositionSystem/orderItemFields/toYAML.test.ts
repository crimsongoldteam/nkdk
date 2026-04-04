import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { dcsOrderItemFieldsFixture, dcsOrderItemFieldsYAMLFixture } from "./__fixtures__/data"
import "./index"

const rule = { type: "OrderItemFields", yaml: "Порядок" } as const

describe("export OrderItemFields to YAML", () => {
  it("exports Asc as 'ПоВозрастанию'", () => {
    const result = testExportPropertyToYAML({ rule, value: [dcsOrderItemFieldsFixture[0]] })
    expect(result).toEqual({ Порядок: ["ПоВозрастанию"] })
  })

  it("exports Desc as '(ПоУбыванию)'", () => {
    const result = testExportPropertyToYAML({ rule, value: [dcsOrderItemFieldsFixture[1]] })
    expect(result).toEqual({ Порядок: ["(ПоУбыванию)"] })
  })

  it("exports full fixture", () => {
    const result = testExportPropertyToYAML({ rule, value: dcsOrderItemFieldsFixture })
    expect(result).toEqual({ Порядок: dcsOrderItemFieldsYAMLFixture })
  })
})
