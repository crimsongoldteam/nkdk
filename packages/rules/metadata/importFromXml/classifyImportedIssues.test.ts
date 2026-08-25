import { describe, expect, it } from "vitest"
import type { ValidationIssue } from "@nkdk/runtime"
import { classifyImportedIssues } from "./classifyImportedIssues"

describe("классификация импортированных ошибок", () => {
  it("объединяет причины одной цели в один invalid", () => {
    const target = { kind: "path" as const, path: ["ДлинаКода"] }
    const issues: ValidationIssue[] = [
      { code: "schema.minimum", kind: "semantic", target },
      { code: "rules.context", kind: "semantic", target },
    ]

    expect(classifyImportedIssues({ issues, requiresImportant: () => false })).toEqual({
      decisions: [{ kind: "invalid", target, issueCodes: ["rules.context", "schema.minimum"] }],
      fatal: [],
    })
  })

  it("выбирает important только по явной регистрации", () => {
    const issue: ValidationIssue = {
      code: "reference.missing",
      kind: "semantic",
      target: { kind: "path", path: ["Источник"] },
    }

    expect(classifyImportedIssues({ issues: [issue], requiresImportant: () => true }).decisions[0]?.kind)
      .toBe("important")
  })

  it("сохраняет occurrence и missing, а инфраструктурный сбой делает фатальным", () => {
    const duplicate: ValidationIssue = {
      code: "rules.duplicate-property",
      kind: "semantic",
      target: { kind: "occurrence", path: ["Реквизиты", "Код"], occurrence: 2 },
    }
    const missing: ValidationIssue = {
      code: "rules.required",
      kind: "semantic",
      target: { kind: "missing", path: ["Заголовок"] },
    }
    const infrastructure: ValidationIssue = {
      code: "validator.crashed",
      kind: "infrastructure",
      target: { kind: "path", path: [] },
    }
    const result = classifyImportedIssues({
      issues: [duplicate, missing, infrastructure],
      requiresImportant: () => false,
    })

    expect(result.decisions.map(({ target }) => target)).toEqual([duplicate.target, missing.target])
    expect(result.fatal).toEqual([infrastructure])
  })
})
