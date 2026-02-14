import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullDendrogramField,
  fullDendrogramFieldPartialEnterprise,
  minimalDendrogramField,
  minimalDendrogramFieldPartialEnterprise,
} from "~/tests/fixtures/forms/dendrogramField/data"
import { mockContext } from "~/tests/mockContext"

describe("importDendrogramFieldFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.DendrogramField,
      yaml: fullDendrogramFieldPartialEnterprise,
      source: fullDendrogramField,
    })

    expect(result).toEqual(fullDendrogramField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.DendrogramField,
      yaml: minimalDendrogramFieldPartialEnterprise,
      source: minimalDendrogramField,
    })

    expect(result).toEqual(minimalDendrogramField)
  })
})
