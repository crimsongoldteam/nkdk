import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { content, contentYAML } from "./__fixtures__/data"
import { ExchangePlanContentRules } from "./rules"

import "./register"

describe("import ExchangePlanContent from YAML", () => {
  it("imports content items with current AutoChangeRecord YAML values", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      yaml: contentYAML,
      rule: ExchangePlanContentRules,
      name: "content",
    })

    expect(result).toEqual(content)
  })
})
