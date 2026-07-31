import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся исполняемым JavaScript без отдельной декларации типов.
import { compareMutationReports, parseReportNames } from "./compare-mutation-reports.mjs"

const mutant = {
  id: "1",
  mutatorName: "BooleanLiteral",
  replacement: "false",
  location: { start: { line: 1, column: 1 }, end: { line: 1, column: 5 } },
}

function report(status: string, source = "export const value = true") {
  return {
    files: {
      "packages/core/value.ts": {
        language: "typescript",
        source,
        mutants: [{ ...mutant, status }],
      },
    },
  }
}

describe("compare mutation reports", () => {
  it("сохраняет обнаруживаемый мутант", () => {
    expect(compareMutationReports(report("Killed"), report("Killed"))).toMatchObject({
      preserved: 1,
      regressions: [],
    })
  })

  it("сообщает о потере обнаруживаемого мутанта", () => {
    expect(compareMutationReports(report("Killed"), report("Survived")).regressions).toHaveLength(1)
  })

  it("сообщает о новом обнаруживаемом мутанте", () => {
    expect(compareMutationReports(report("Survived"), report("Killed")).improvements).toHaveLength(1)
  })

  it("отклоняет изменившийся production-исходник", () => {
    expect(() => compareMutationReports(report("Killed"), report("Killed", "changed"))).toThrow(
      "Production-исходники отчётов различаются"
    )
  })

  it("принимает разделитель аргументов pnpm и безопасные имена", () => {
    expect(parseReportNames(["--", "before", "after-change"])).toEqual(["before", "after-change"])
  })
})
