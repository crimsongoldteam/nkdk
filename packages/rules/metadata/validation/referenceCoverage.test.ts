import { describe, expect, it } from "vitest"

import type { ValidationPendingCheck } from "./projectValidationPendingChecks"
import { validatePendingChecks } from "./projectValidationPendingChecks"
import { missingOwnerMetadataCache } from "./tests/validationTestSupport"

describe("reference coverage", () => {
  it("проверяет покрытие только по существующим ссылкам", () => {
    const check = {
      kind: "referenceCoverage",
      yamlPath: ["Измерения", "Второе", "ДанныеВедущихРегистров"],
      location: { filePath: "/project/Свойства.yaml", line: 8, col: 5 },
      requirements: [{
        message: "требуется связь с регистром Ведущий",
        candidates: ["CalculationRegister.Ведущий.Dimension.Ключ"],
        coveredBy: [],
      }],
    } satisfies Extract<ValidationPendingCheck, { kind: "referenceCoverage" }>

    expect(validate(check, () => "missing")).toEqual([])
    expect(validate(check, () => "found")).toEqual([
      expect.objectContaining({ source: "cross-file", message: expect.stringContaining("Ведущий") }),
    ])

    const brokenCurrentLink = {
      ...check,
      requirements: check.requirements.map((requirement) => ({
        ...requirement,
        coveredBy: ["CalculationRegister.Ведущий.Dimension.Несуществующее"],
      })),
    } satisfies Extract<ValidationPendingCheck, { kind: "referenceCoverage" }>
    expect(validate(brokenCurrentLink, (canonical) => canonical.endsWith("Несуществующее") ? "missing" : "found")).toEqual([])
  })
})

function validate(
  check: ValidationPendingCheck,
  resolveReference: (canonical: string) => "found" | "missing",
) {
  return validatePendingChecks({
    ownerCache: missingOwnerMetadataCache,
    checks: [check],
    resolveReference,
  } as Parameters<typeof validatePendingChecks>[0] & { resolveReference: typeof resolveReference }).diagnostics
}
