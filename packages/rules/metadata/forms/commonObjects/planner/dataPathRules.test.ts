import { describe, expect, it } from "vitest"

import { plannerDataPathRules } from "./dataPathRules"

describe("Planner data path declarations", () => {
  const graph = plannerDataPathRules.find((candidate) => candidate.kind === "typedGraph")
  const planner = graph?.kind === "typedGraph"
    ? graph.types.find(({ type }) => type === "Planner")
    : undefined

  it("declares terminal types for all confirmed fields", () => {
    const typesByYaml = Object.fromEntries((planner?.members ?? []).map(({ yaml, target }) => [
      yaml,
      target.kind === "terminal" ? target.terminalTypes[0] : target.kind,
    ]))

    expect(typesByYaml).toEqual({
      НачалоПериодаОтображения: "dateTime", КонецПериодаОтображения: "dateTime",
      ВыравниватьГраницыЭлементовПоШкалеВремени: "boolean",
      ОтображатьПеренесенныеЗаголовкиШкалыВремени: "boolean", ОтображатьПеренесенныеЗаголовки: "boolean",
      КратностьПериодическогоВарианта: "decimal", ОтступСНачалаПереносаШкалыВремени: "decimal",
      ОтступСКонцаПереносаШкалыВремени: "decimal", ОтображатьТекущуюДату: "boolean",
      АвтоМинимальнаяШиринаКолонки: "boolean", МинимальнаяШиринаКолонки: "decimal",
      АвтоМинимальнаяВысотаСтроки: "boolean", МинимальнаяВысотаСтроки: "decimal",
      ФиксироватьЗаголовокИзмерений: "boolean", ФиксироватьЗаголовокШкалыВремени: "boolean",
    })
  })

  it("exposes exactly the confirmed fields in the conditional-filter view", () => {
    const view = plannerDataPathRules.find((candidate) => candidate.kind === "dataPathView")
    expect(view?.kind === "dataPathView" && view.view.types.Planner).toHaveLength(15)
  })
})
