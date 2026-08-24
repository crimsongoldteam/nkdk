import { describe, expect, it } from "vitest"
import type { ValidationIssue } from "./validationIssue"
import { evaluateXmlAnomalyBoundary } from "./xmlAnomalyBoundary"

const semanticIssue: ValidationIssue = {
  code: "schema.type",
  kind: "semantic",
  target: { kind: "path", path: ["Использовать"] },
}

describe("граница смысловой XML-аномалии", () => {
  it("подавляет принятую смысловую ошибку invalid", () => {
    expect(evaluateXmlAnomalyBoundary({
      annotation: "invalid",
      target: semanticIssue.target,
      issues: [semanticIssue],
      importantRegistered: false,
    })).toEqual({ accepted: [semanticIssue], visible: [], contract: [] })
  })

  it("считает тег лишним, когда значение уже корректно", () => {
    expect(evaluateXmlAnomalyBoundary({
      annotation: "invalid",
      target: semanticIssue.target,
      issues: [],
      importantRegistered: false,
    }).contract).toEqual([expect.objectContaining({
      code: "xml/anomaly-tag-unnecessary",
      target: semanticIssue.target,
    })])
  })

  it("не подавляет инфраструктурную ошибку и ошибку дочернего пути", () => {
    const infrastructure: ValidationIssue = { ...semanticIssue, code: "validator.crashed", kind: "infrastructure" }
    const child: ValidationIssue = { ...semanticIssue, target: { kind: "path", path: ["Использовать", "Вид"] } }
    const result = evaluateXmlAnomalyBoundary({
      annotation: "invalid",
      target: semanticIssue.target,
      issues: [semanticIssue, infrastructure, child],
      importantRegistered: false,
    })

    expect(result.accepted).toEqual([semanticIssue])
    expect(result.visible).toEqual([infrastructure, child])
  })

  it("требует important только для зарегистрированной границы", () => {
    expect(evaluateXmlAnomalyBoundary({
      annotation: "invalid",
      target: semanticIssue.target,
      issues: [semanticIssue],
      importantRegistered: true,
    }).contract[0]?.code).toBe("xml/important-required")
    expect(evaluateXmlAnomalyBoundary({
      annotation: "important",
      target: semanticIssue.target,
      issues: [semanticIssue],
      importantRegistered: false,
    }).contract[0]?.code).toBe("xml/important-not-registered")
  })
})
