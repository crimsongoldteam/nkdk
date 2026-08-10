import { describe, expect, it } from "vitest"
import { callAtomicFromYAML } from "../../../ruleRuntime"
import { mockContext } from "../../../../tests/mockContext"
import { importFromYAML } from "@nkdk/runtime"
import {
  nilAndBooleanAvailableValues,
  nilAndBooleanAvailableValuesYAML,
  stringAvailableValues,
  stringAvailableValuesYAML,
} from "./__fixtures__/data"
import "../index"

const rule = { type: "DcsAvailableValues" } as const

describe("import DcsAvailableValues from YAML", { timeout: 30_000 }, () => {
  it("imports string values", () => {
    const result = callAtomicFromYAML({
      context: mockContext,
      rule,
      value: stringAvailableValuesYAML,
    })

    expect(result).toEqual(stringAvailableValues)
  })

  it("imports double-quoted numeric string value from parsed YAML as string", () => {
    const yaml = importFromYAML(['- Значение: "2"', "  Представление: 2 знака"].join("\n"))

    const result = callAtomicFromYAML({
      context: mockContext,
      rule,
      value: yaml,
    })

    expect(result).toEqual([
      {
        itemType: "DcsAvailableValue",
        value: { type: "string", value: "2" },
        presentation: { items: { ru: "2 знака" } },
      },
    ])
  })

  it("imports absent value as undefined", () => {
    const result = callAtomicFromYAML({
      context: mockContext,
      rule,
      value: nilAndBooleanAvailableValuesYAML,
    })

    expect(result).toEqual(nilAndBooleanAvailableValues)
  })

})
