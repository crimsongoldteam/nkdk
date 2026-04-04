import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { dcsOrderItemFieldsFixture, dcsOrderItemFieldsYAMLFixture } from "./__fixtures__/data"
import "./index"

const rule = { type: "OrderItemFields" } as const

describe("import OrderItemFields from YAML", () => {
  it("imports 'ПоВозрастанию' as Asc", () => {
    const result = testImportPropertyFromYAML({ rule, value: ["ПоВозрастанию"] })
    expect(result).toEqual([dcsOrderItemFieldsFixture[0]])
  })

  it("imports '(ПоУбыванию)' as Desc", () => {
    const result = testImportPropertyFromYAML({ rule, value: ["(ПоУбыванию)"] })
    expect(result).toEqual([dcsOrderItemFieldsFixture[1]])
  })

  it("imports full YAML fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: dcsOrderItemFieldsYAMLFixture })
    expect(result).toEqual(dcsOrderItemFieldsFixture)
  })
})
