import { describe, expect, it } from "vitest"
import { exportPropertyToYAML } from "../../../orchestration"
import { mockContext } from "../../../../tests/mockContext"
import {
  nilAndBooleanAvailableValues,
  nilAndBooleanAvailableValuesYAML,
  stringAvailableValues,
  stringAvailableValuesYAML,
} from "./__fixtures__/data"

const rule = { type: "DcsAvailableValues", yaml: "ДоступныеЗначения" } as const

describe("export DcsAvailableValues to YAML", () => {
  it("exports string values", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule,
      value: stringAvailableValues,
    })

    expect(result).toEqual({ ДоступныеЗначения: stringAvailableValuesYAML })
  })

  it("exports absent value as absent key", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule,
      value: nilAndBooleanAvailableValues,
    })

    expect(result).toEqual({ ДоступныеЗначения: nilAndBooleanAvailableValuesYAML })
  })
})
