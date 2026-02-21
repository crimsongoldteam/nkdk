import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import { fullCommandBarChildItemsAllYAML } from "~/tests/fixtures/commandBarChildItems/data"
import {
  fullCommandBar,
  fullCommandBarPartialYAML,
  fullCommandBarSource,
  minimalCommandBar,
  minimalCommandBarPartialYAML,
} from "~/tests/fixtures/forms/commandBar/data"
import { mockContext } from "~/tests/mockContext"

const context = {
  ...mockContext,
  allElements: fullCommandBarChildItemsAllYAML,
}

describe("importCommandBarFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: context,
      itemType: CollectionFormElementType.CommandBar,
      yaml: fullCommandBarPartialYAML,
      source: fullCommandBarSource,
    })

    expect(result).toEqual(fullCommandBar)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: context,
      itemType: CollectionFormElementType.CommandBar,
      yaml: minimalCommandBarPartialYAML,
      source: minimalCommandBar,
    })

    expect(result).toEqual(minimalCommandBar)
  })
})
