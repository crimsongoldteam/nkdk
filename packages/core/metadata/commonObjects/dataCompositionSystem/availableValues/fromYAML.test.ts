import { describe, expect, it } from "vitest"
import { importPropertyFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import {
  nilAndBooleanAvailableValues,
  nilAndBooleanAvailableValuesYAML,
  stringAvailableValues,
  stringAvailableValuesYAML,
} from "./__fixtures__/data"

const rule = { type: "DcsAvailableValues" } as const

describe("import DcsAvailableValues from YAML", () => {
  it("imports string values", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule,
      value: stringAvailableValuesYAML,
    })

    expect(result).toEqual(stringAvailableValues)
  })

  it("imports absent value as undefined", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule,
      value: nilAndBooleanAvailableValuesYAML,
    })

    expect(result).toEqual(nilAndBooleanAvailableValues)
  })
})
