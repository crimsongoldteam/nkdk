import { describe, expect, it } from "vitest"
import { createConfigurationLanguages } from "@nkdk/runtime"

import { parseMetadataTargetFromYAML } from "../ruleRuntime/metadataTarget"
import type { ProjectValidationSecondPassParams } from "./projectValidationPasses"
import { validateProjectFileSecondPass } from "./projectValidationPasses"
import { missingOwnerMetadataCache } from "./tests/validationTestSupport"

const canonical = "CalculationRegister.Ведущий.Dimension.Ключ"
const constraint = {
  kind: "member" as const,
  owner: "explicit" as const,
  roots: ["CalculationRegister" as const],
  memberKinds: ["Dimension" as const],
}
const parsed = parseMetadataTargetFromYAML({
  value: "РегистрРасчета.Ведущий.Измерение.Ключ",
  constraint,
})
if (!parsed.ok) throw new Error("Некорректная тестовая ссылка")
const target = parsed.target

describe("reference coverage second pass", () => {
  it("не добавляет ошибку покрытия к ошибке битой ссылки", () => {
    const result = validateProjectFileSecondPass(secondPassParams(() => ({
      ok: false,
      reason: "notFound",
      diagnostics: [diagnostic('Не найдена ссылка "CalculationRegister.Ведущий.Dimension.Ключ"', "reference")],
    })))

    expect(result.diagnostics).toEqual([expect.objectContaining({ source: "reference" })])
    expect(result.diagnostics.some(({ message }) => message.includes("требуется связь"))).toBe(false)
  })

  it("проверяет покрытие для существующей ссылки", () => {
    const result = validateProjectFileSecondPass(secondPassParams(() => ({ ok: true })))
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ source: "cross-file", message: expect.stringContaining("требуется связь") }),
    ])
  })
})

function secondPassParams(
  resolveReference: ProjectValidationSecondPassParams["referenceIndex"]["resolve"],
): ProjectValidationSecondPassParams {
  return {
    state: {
      kind: "properties",
      file: {} as ProjectValidationSecondPassParams["state"] extends { file: infer File } ? File : never,
      firstPassDiagnostics: [],
      pendingReferences: [{
        filePath: "/project/Свойства.yaml",
        yamlPath: ["Измерения", "Первое", "ДанныеВедущихРегистров", 0],
        canonical,
        target,
        constraint,
      }],
      pendingChecks: [{
        kind: "referenceCoverage",
        yamlPath: ["Измерения", "Второе", "ДанныеВедущихРегистров"],
        location: { filePath: "/project/Свойства.yaml", line: 8, col: 5 },
        requirements: [{ message: "требуется связь с регистром Ведущий", candidates: [canonical], coveredBy: [] }],
      }],
    },
    projectDir: "/project",
    context: { version: "2.20", languages: createConfigurationLanguages({ default: "ru", registered: ["ru"] }) },
    ownerCache: missingOwnerMetadataCache,
    referenceIndex: { resolve: resolveReference, stats: () => ({ hits: 0, misses: 0, conflicts: 0, filterFailures: 0, unsupported: 0, fallbacks: 0 }) },
  }
}

function diagnostic(message: string, source: "reference" | "cross-file") {
  return { filePath: "/project/Свойства.yaml", line: 1, col: 1, severity: "error" as const, source, message }
}
