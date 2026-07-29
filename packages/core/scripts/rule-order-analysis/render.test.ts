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

  it("renders separate cf and cfe tables with extension bases", () => {
    const report = renderRuleOrderReportMarkdown({
      ...empty,
      configurations: ["cf/all", "cfe/control"],
      configurationStats: [
        {
          sourceKind: "configuration",
          configuration: "cf/all",
          assignmentCount: 10,
          xmlFileCount: 12,
          observationCount: 20,
          skippedObservationCount: 0,
        },
        {
          sourceKind: "configurationExtension",
          configuration: "cfe/control",
          baseConfiguration: "cf/all",
          assignmentCount: 2,
          xmlFileCount: 3,
          observationCount: 4,
          skippedObservationCount: 0,
        },
      ],
    })

    expect(report).toContain("## Конфигурации cf")
    expect(report).toContain("| cf/all | 10 | 12 | 20 | 0 |")
    expect(report).toContain("## Расширения cfe")
    expect(report).toContain("| cfe/control | cf/all | 2 | 3 | 4 | 0 |")
  })
})
