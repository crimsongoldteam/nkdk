import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial } from "~/metadata/metadataFactory"
import {
  fullDendrogramField,
  fullDendrogramFieldPartialEnterprise,
  minimalDendrogramField,
  minimalDendrogramFieldPartialEnterprise,
} from "~/tests/fixtures/forms/dendrogramField/data"
import { mockContext } from "~/tests/mockContext"

describe("importDendrogramFieldFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromYAMLPartial({
      context: mockContext,
      elementType: FormElementType.DendrogramField,
      data: fullDendrogramFieldPartialEnterprise,
      source: fullDendrogramField,
    })

    expect(result).toEqual(fullDendrogramField)
  })

  it("should import minimal", () => {
    const result = importElementFromYAMLPartial({
      context: mockContext,
      elementType: FormElementType.DendrogramField,
      data: minimalDendrogramFieldPartialEnterprise,
      source: minimalDendrogramField,
    })

    expect(result).toEqual(minimalDendrogramField)
  })
})
