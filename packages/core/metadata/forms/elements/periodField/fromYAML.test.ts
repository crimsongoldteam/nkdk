import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPeriodField,
  fullPeriodFieldPartialYAML,
  minimalPeriodField,
  minimalPeriodFieldPartialYAML,
} from "~/tests/fixtures/forms/periodField/data"
import { mockContext } from "~/tests/mockContext"

describe("importPeriodFieldFromYAML", () => {
  it("should return undefined when source is undefined", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.PeriodField,
      yaml: undefined,
      source: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.PeriodField,
      yaml: fullPeriodFieldPartialYAML,
      source: fullPeriodField,
    })

    expect(result).toEqual(fullPeriodField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.PeriodField,
      yaml: minimalPeriodFieldPartialYAML,
      source: minimalPeriodField,
    })

    expect(result).toEqual(minimalPeriodField)
  })
})
