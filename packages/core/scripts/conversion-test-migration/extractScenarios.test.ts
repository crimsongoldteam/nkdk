import { describe, expect, it } from "vitest"

import type { DeletedTestSource } from "./types"
import { extractScenarios } from "./extractScenarios"

describe("extractScenarios", () => {
  it("извлекает обычные it и test", () => {
    const scenarios = extractScenarios(
      source(
        "metadata/fromXML.test.ts",
        [
          'import { full } from "./__fixtures__/full"',
          'it("обычный", () => expect(full).toBeDefined())',
          'test("обычный test", () => read("minimal.xml"))',
        ].join("\n")
      )
    )

    expect(scenarios.map(pickScenario)).toEqual([
      {
        direction: "fromXML",
        oldTitle: "обычный",
        fixtures: ["./__fixtures__/full"],
        line: 2,
      },
      {
        direction: "fromXML",
        oldTitle: "обычный test",
        fixtures: ["./__fixtures__/full", "minimal.xml"],
        line: 3,
      },
    ])
  })

  it("учитывает параметризованный тест и вложенный тест параметризованной группы", () => {
    const scenarios = extractScenarios(
      source(
        "metadata/toXML.test.ts",
        [
          'it.each([[1], [2]])("параметр %s", () => {})',
          'describe.each(["a", "b"])("группа %s", () => {',
          '  it(`вложенный ${name}`, () => {})',
          "})",
        ].join("\n")
      )
    )

    expect(scenarios).toHaveLength(2)
    expect(scenarios.map(pickScenario)).toEqual([
      { direction: "toXML", oldTitle: "параметр %s", fixtures: [], line: 1 },
      { direction: "toXML", oldTitle: "`вложенный ${name}`", fixtures: [], line: 3 },
    ])
    expect(scenarios[0]?.declarationText).toContain("it.each")
    expect(scenarios[0]?.id).toBe("delete123:metadata/toXML.test.ts:1:0")
  })

  it("отмечает самостоятельный тест и сохраняет выражение динамического заголовка", () => {
    const [scenario] = extractScenarios(
      source("metadata/syncExternal.test.ts", 'const title = "sync"\ntest(title, () => read("state.yaml"))')
    )

    expect(scenario).toMatchObject({
      direction: "standalone",
      oldTitle: "title",
      fixtures: ["state.yaml"],
      line: 2,
    })
  })
})

function source(path: string, sourceText: string): DeletedTestSource {
  return {
    deletingCommit: "delete123",
    parentCommit: "parent123",
    path,
    sourceText,
  }
}

function pickScenario(scenario: ReturnType<typeof extractScenarios>[number]) {
  return {
    direction: scenario.direction,
    oldTitle: scenario.oldTitle,
    fixtures: scenario.fixtures,
    line: scenario.line,
  }
}
