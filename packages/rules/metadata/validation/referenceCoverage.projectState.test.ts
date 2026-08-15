import { describe, expect, it } from "vitest"

import { validateProjectStateReferenceCoverageBatch } from "./projectStateDependencyValidation"

describe("reference coverage in ProjectState", () => {
  it("не создаёт каскадную ошибку для битой ссылки", () => {
    const check = referenceCoverageCheck()
    expect(validateProjectStateReferenceCoverageBatch({
      projectDir: "/project",
      checks: [check],
      queryPort: { resolveTargets: (requests) => requests.map(({ requestId }) => ({ requestId, status: "missing" })) },
    })).toEqual([])

    expect(validateProjectStateReferenceCoverageBatch({
      projectDir: "/project",
      checks: [check],
      queryPort: { resolveTargets: (requests) => requests.map(({ requestId }) => ({
        requestId,
        status: "found",
        target: { kind: "member", canonical: "CalculationRegister.Ведущий.Dimension.Ключ" },
        source: { projectPath: "cf/РегистрРасчета/Ведущий/Свойства.yaml", componentPath: "cf" },
      })) },
    })).toEqual([expect.objectContaining({
      filePath: check.projectPath,
      path: "/Измерения/Второе/ДанныеВедущихРегистров",
      source: "cross-file",
      message: expect.stringContaining("Ведущий"),
    })])
  })
})

function referenceCoverageCheck() {
  return {
    requestId: "coverage:0",
    componentPath: "cf",
    projectPath: "cf/РегистрРасчета/Основной/Перерасчеты/Проверка/Свойства.yaml",
    check: {
      kind: "referenceCoverage" as const,
      yamlPath: ["Измерения", "Второе", "ДанныеВедущихРегистров"],
      location: { line: 8, col: 5, path: "/Измерения/Второе/ДанныеВедущихРегистров" },
      requirements: [{
        message: "требуется связь с регистром Ведущий",
        candidates: ["CalculationRegister.Ведущий.Dimension.Ключ"],
        coveredBy: [],
      }],
    },
  }
}
