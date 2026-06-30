import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { contentFromCompactYAML, contentYAML } from "./__fixtures__/data"
import { ExchangePlanContentRules } from "./rules"

import "./register"

const emptyContent = {
  itemType: "ExchangePlanContent" as const,
  items: [],
}

describe("import ExchangePlanContent from YAML", () => {
  it("imports content items with current AutoChangeRecord YAML values", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      yaml: contentYAML,
      rule: ExchangePlanContentRules,
      name: "content",
    })

    expect(result).toEqual(contentFromCompactYAML)
  })

  it("imports [] as explicit empty content", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      yaml: [],
      rule: ExchangePlanContentRules,
    })

    expect(result).toEqual(emptyContent)
  })
})
