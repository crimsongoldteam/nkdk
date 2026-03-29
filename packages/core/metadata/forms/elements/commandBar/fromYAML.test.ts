import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import { fullCommandBarChildItemsAllYAML } from "~/tests/fixtures/commandBarChildItems/data"
import {
  fullCommandBar,
  fullCommandBarPartialYAML,
  fullCommandBarSource,
  minimalCommandBar,
  minimalCommandBarPartialYAML,
} from "~/metadata/forms/elements/commandBar/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

const context: ConfigurationContext = {
  ...mockContext,
  allElements: fullCommandBarChildItemsAllYAML,
}

describe("importCommandBarFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: context,
      itemType: "CommandBar",
      yaml: fullCommandBarPartialYAML,
      source: fullCommandBarSource,
    })

    expect(result).toEqual(fullCommandBar)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: context,
      itemType: "CommandBar",
      yaml: minimalCommandBarPartialYAML,
      source: minimalCommandBar,
    })

    expect(result).toEqual(minimalCommandBar)
  })
})
