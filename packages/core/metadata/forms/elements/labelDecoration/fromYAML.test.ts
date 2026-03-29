import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import { fullLabelDecoration, fullLabelDecorationPartialYAML } from "~/metadata/forms/elements/labelDecoration/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("importLabelDecorationFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "LabelDecoration",
      yaml: fullLabelDecorationPartialYAML,
      source: fullLabelDecoration,
    })

    expect(result).toEqual(fullLabelDecoration)
  })
})
