import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullCommandBar,
  fullCommandBarPartialYAML,
  minimalCommandBar,
  minimalCommandBarPartialYAML,
} from "~/tests/fixtures/forms/commandBar/data"
import { mockContext } from "~/tests/mockContext"

describe("importCommandBarFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.CommandBar,
      yaml: fullCommandBarPartialYAML,
      source: fullCommandBar,
    })

    expect(result).toEqual(fullCommandBar)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.CommandBar,
      yaml: minimalCommandBarPartialYAML,
      source: minimalCommandBar,
    })

    expect(result).toEqual(minimalCommandBar)
  })
})
