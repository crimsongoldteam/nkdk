import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import { fullPage, fullPagePartialYAML, minimalPage, minimalPagePartialYAML } from "~/metadata/forms/elements/page/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("importPageFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "Page",
      yaml: fullPagePartialYAML,
      source: fullPage,
    })

    expect(result).toEqual(fullPage)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "Page",
      yaml: minimalPagePartialYAML,
      source: minimalPage,
    })

    expect(result).toEqual(minimalPage)
  })
})
