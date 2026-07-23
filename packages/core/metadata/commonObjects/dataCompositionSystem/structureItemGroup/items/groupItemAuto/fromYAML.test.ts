import { describe, expect, it } from "vitest"
import { testAtomicFromYAML } from "../../../../../../tests/property/atomicFromYAML"
import {
  fixtureGroupItemAuto,
  fixtureGroupItemAutoUseFalse,
  fixtureGroupItemAutoUseFalseYAML,
  fixtureGroupItemAutoYAML,
} from "./__fixtures__/data"

const rule = { type: "GroupItemAuto" } as const

describe("import GroupItemAuto from YAML", () => {
  it("imports '[Авто]'", () => {
    const result = testAtomicFromYAML({ rule, value: fixtureGroupItemAutoYAML })
    expect(result).toEqual(fixtureGroupItemAuto)
  })

  it("imports '([Авто])'", () => {
    const result = testAtomicFromYAML({ rule, value: fixtureGroupItemAutoUseFalseYAML })
    expect(result).toEqual(fixtureGroupItemAutoUseFalse)
  })
})
