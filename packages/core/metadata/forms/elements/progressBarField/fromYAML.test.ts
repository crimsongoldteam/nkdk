import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullProgressBarField,
  fullProgressBarFieldPartialEnterprise,
  minimalProgressBarField,
  minimalProgressBarFieldPartialEnterprise,
} from "~/tests/fixtures/forms/progressBarField/data"
import { mockContext } from "~/tests/mockContext"

describe("importProgressBarFieldFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.ProgressBarField,
      yaml: fullProgressBarFieldPartialEnterprise,
      source: fullProgressBarField,
    })

    expect(result).toEqual(fullProgressBarField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.ProgressBarField,
      yaml: minimalProgressBarFieldPartialEnterprise,
      source: minimalProgressBarField,
    })

    expect(result).toEqual(minimalProgressBarField)
  })
})
