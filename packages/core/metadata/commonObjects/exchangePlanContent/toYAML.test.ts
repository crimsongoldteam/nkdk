import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { content, contentYAML } from "./__fixtures__/data"
import { ExchangePlanContentRules } from "./rules"

import "./register"

describe("export ExchangePlanContent to YAML", () => {
  it("exports content items with current AutoChangeRecord YAML values", () => {
    const result = exportMetadataItemToYAML({
      context: mockContext,
      data: content,
      rule: ExchangePlanContentRules,
    })

    expect(result).toEqual(contentYAML)
  })
})
