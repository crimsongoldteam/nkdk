import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "../../../../../../tests/property/importPropertyFromYAML"
import {
  fixtureGroupItemAuto,
  fixtureGroupItemAutoUseFalse,
  fixtureGroupItemAutoUseFalseYAML,
  fixtureGroupItemAutoYAML,
} from "./__fixtures__/data"

const rule = { type: "GroupItemAuto" } as const

describe("import GroupItemAuto from YAML", () => {
  it("imports '[Авто]'", () => {
    const result = testImportPropertyFromYAML({ rule, value: fixtureGroupItemAutoYAML })
    expect(result).toEqual(fixtureGroupItemAuto)
  })

  it("imports '([Авто])'", () => {
    const result = testImportPropertyFromYAML({ rule, value: fixtureGroupItemAutoUseFalseYAML })
    expect(result).toEqual(fixtureGroupItemAutoUseFalse)
  })
})
