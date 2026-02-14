import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPeriodField,
  fullPeriodFieldPartialEnterprise,
  minimalPeriodField,
  minimalPeriodFieldPartialEnterprise,
} from "~/tests/fixtures/forms/periodField/data"
import { mockContext } from "~/tests/mockContext"

describe("importPeriodFieldFromEnterprise", () => {
  it("should return undefined when source is undefined", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.PeriodField,
      yaml: undefined,
      source: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.PeriodField,
      yaml: fullPeriodFieldPartialEnterprise,
      source: fullPeriodField,
    })

    expect(result).toEqual(fullPeriodField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.PeriodField,
      yaml: minimalPeriodFieldPartialEnterprise,
      source: minimalPeriodField,
    })

    expect(result).toEqual(minimalPeriodField)
  })
})
