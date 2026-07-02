import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "../../../../../../tests/property/exportPropertyToYAML"
import {
  fixtureGroupItemAuto,
  fixtureGroupItemAutoUseFalse,
  fixtureGroupItemAutoUseFalseYAML,
  fixtureGroupItemAutoYAML,
} from "./__fixtures__/data"

const rule = { type: "GroupItemAuto", yaml: "АвтоГруппировка" } as const

describe("export GroupItemAuto to YAML", () => {
  it("exports '[Авто]'", () => {
    const result = testExportPropertyToYAML({ rule, value: fixtureGroupItemAuto })
    expect(result).toEqual({ АвтоГруппировка: fixtureGroupItemAutoYAML })
  })

  it("exports '([Авто])'", () => {
    const result = testExportPropertyToYAML({ rule, value: fixtureGroupItemAutoUseFalse })
    expect(result).toEqual({ АвтоГруппировка: fixtureGroupItemAutoUseFalseYAML })
  })
})
