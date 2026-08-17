import { describe, expect, it } from "vitest"

import { plannerDataPathRules } from "./dataPathRules"

describe("Planner data path declarations", () => {
  const graph = plannerDataPathRules.find((candidate) => candidate.kind === "typedGraph")
  const planner = graph?.kind === "typedGraph"
    ? graph.types.find(({ type }) => type === "Planner")
    : undefined

  it.each([
    ["BeginOfRepresentationPeriod", "НачалоПериодаОтображения", "dateTime"],
    ["ShowCurrentDate", "ОтображатьТекущуюДату", "boolean"],
    ["MinColumnWidth", "МинимальнаяШиринаКолонки", "decimal"],
  ] as const)("declares %s as %s", (internal, yaml, terminalType) => {
    expect(planner?.members.find((member) => member.internal === internal)).toEqual({
      internal,
      yaml,
      target: { kind: "terminal", terminalTypes: [terminalType] },
    })
  })

  it("exposes exactly the confirmed fields in the conditional-filter view", () => {
    const view = plannerDataPathRules.find((candidate) => candidate.kind === "dataPathView")
    expect(view?.kind === "dataPathView" && view.view.types.Planner).toHaveLength(15)
  })
})
