import { describe, expect, it } from "vitest"
import { renderRuleOrderConflictsJson, renderRuleOrderReportMarkdown } from "./render"
import type { AnalyzeRuleOrderResult } from "../../metadata/ruleOrderAnalysis/analyze"

const empty: AnalyzeRuleOrderResult = {
  configurations: ["all"],
  configurationStats: [],
  assignmentCount: 0,
  xmlFileCount: 0,
  observationCount: 0,
  skippedObservationCount: 0,
  skippedItemTypes: [],
  rules: [],
  canonicalOrders: [],
  unobservedSources: [],
  ambiguities: [],
}

describe("rule order report rendering", () => {
  it("renders stable JSON with a trailing newline", () => {
    expect(renderRuleOrderConflictsJson(empty)).toBe(`${JSON.stringify(empty, null, 2)}\n`)
  })

  it("explains that an empty report has no conflicts", () => {
    expect(renderRuleOrderReportMarkdown(empty)).toContain("Конфликты порядка не найдены.")
  })

  it("перечисляет правила без наблюдений", () => {
    const report = renderRuleOrderReportMarkdown({
      ...empty,
      unobservedSources: [
        {
          candidate: "forms/elements/unseen/rules.ts#UnseenRules",
          filePath: "/metadata/forms/elements/unseen/rules.ts",
          exportName: "UnseenRules",
          propertyPath: [],
          declarationOrder: ["name"],
        },
      ],
    })

    expect(report).toContain("Правила без наблюдений: 1")
    expect(report).toContain("forms/elements/unseen/rules.ts#UnseenRules")
  })
})
