import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullCommandBar,
  fullCommandBarPartialEnterprise,
  minimalCommandBar,
  minimalCommandBarPartialEnterprise,
} from "~/tests/fixtures/forms/commandBar/data"
import { mockContext } from "~/tests/mockContext"

describe("importCommandBarFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.CommandBar,
      yaml: fullCommandBarPartialEnterprise,
      source: fullCommandBar,
    })

    expect(result).toEqual(fullCommandBar)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.CommandBar,
      yaml: minimalCommandBarPartialEnterprise,
      source: minimalCommandBar,
    })

    expect(result).toEqual(minimalCommandBar)
  })
})
