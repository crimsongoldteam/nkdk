import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import {
  fullPeriodField,
  fullPeriodFieldPartialYAML,
  minimalPeriodField,
  minimalPeriodFieldPartialYAML,
} from "~/metadata/forms/elements/periodField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("importPeriodFieldFromYAML", () => {
  // it("should return undefined when source is undefined", () => {
  //   const result = importElementFromPartialYAML({
  //     context: mockContext,
  //     itemType: "PeriodField",
  //     yaml: undefined,
  //     source: undefined,
  //   })

  //   expect(result).toBeUndefined()
  // })

  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "PeriodField",
      yaml: fullPeriodFieldPartialYAML,
      source: fullPeriodField,
    })

    expect(result).toEqual(fullPeriodField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "PeriodField",
      yaml: minimalPeriodFieldPartialYAML,
      source: minimalPeriodField,
    })

    expect(result).toEqual(minimalPeriodField)
  })
})
