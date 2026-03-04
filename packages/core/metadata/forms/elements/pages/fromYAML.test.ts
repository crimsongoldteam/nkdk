import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import { fullPages, fullPagesPartialYAML } from "~/tests/fixtures/forms/pages/data"
import { mockContext } from "~/tests/mockContext"

describe("importPagesFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "Pages",
      yaml: fullPagesPartialYAML,
      source: fullPages,
    })

    expect(result).toEqual(fullPages)
  })
})
