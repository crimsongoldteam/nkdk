import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML } from "../../orchestration"
import { mockContext } from "../../../tests/mockContext"
import { content, contentYAML } from "./__fixtures__/data"
import { ExchangePlanContentRules } from "./rules"

import "./register"

const emptyContent = {
  itemType: "ExchangePlanContent" as const,
  items: [],
}

describe("export ExchangePlanContent to YAML", () => {
  it("exports content items with current AutoChangeRecord YAML values", () => {
    const result = exportMetadataItemToYAML({
      context: mockContext,
      data: content,
      rule: ExchangePlanContentRules,
    })

    expect(result).toEqual(contentYAML)
  })

  it("exports empty content as []", () => {
    const result = exportMetadataItemToYAML({
      context: mockContext,
      data: emptyContent,
      rule: ExchangePlanContentRules,
    })

    expect(result).toEqual([])
  })
})
