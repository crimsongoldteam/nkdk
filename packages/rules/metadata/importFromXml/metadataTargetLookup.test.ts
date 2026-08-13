import type { MetadataRootName } from "@nkdk/runtime/rule-kit"
import { describe, expect, it, vi } from "vitest"
import type { ProjectStateQueryPort } from "../projectState/contracts/dependencyValidation"
import type { ProjectReferenceValueContributor } from "../validation/projectReferenceIndexRegistry"
import { resolveImportedMetadataTargetStatus } from "./metadataTargetLookup"

const canonical = "Catalog.Товары.Основной"

describe("разрешение ссылки при импорте XML", () => {
  it.each(["found", "ambiguous"] as const)(
    "сохраняет прямой результат %s и не обращается к сведениям владельца",
    (status) => {
      const readOwners = vi.fn()

      expect(resolveImportedMetadataTargetStatus({
        canonical,
        componentPath: "cf",
        projectDir: "/project",
        queryPort: {
          resolveTargets: () => status === "found"
            ? [{
                requestId: `import-value:${canonical}`,
                status,
                target: { kind: "value", canonical },
                source: { projectPath: "cf/Справочник/Товары/Свойства.yaml", componentPath: "cf" },
              }]
            : [{ requestId: `import-value:${canonical}`, status }],
          readOwners,
        },
        getContributor: () => undefined,
      })).toBe(status)
      expect(readOwners).not.toHaveBeenCalled()
    },
  )

  it.each([
    ["found", "found"],
    ["ambiguous", "ambiguous"],
  ] as const)("после прямого missing возвращает смысловой результат %s", (ownerStatus, expected) => {
    expect(resolveWithSemanticFallback({ ownerStatus })).toBe(expected)
  })

  it("преобразует несовместимое смысловое значение в missing", () => {
    expect(resolveWithSemanticFallback({
      ownerStatus: "found",
      getContributor: () => () => ({
        ok: false,
        diagnostics: [{
          filePath: "/project/cf/Справочник/Товары/Свойства.yaml",
          line: 1,
          col: 1,
          severity: "error",
          source: "reference",
          message: "Значение несовместимо",
        }],
      }),
    })).toBe("missing")
  })
})

function resolveWithSemanticFallback(params: {
  readonly ownerStatus: "found" | "ambiguous"
  readonly getContributor?: (root: MetadataRootName) => ProjectReferenceValueContributor | undefined
}) {
  const requestId = `import-value:${canonical}`
  const queryPort: Pick<ProjectStateQueryPort, "resolveTargets" | "readOwners"> = {
    resolveTargets: () => [{ requestId, status: "missing" }],
    readOwners: () => params.ownerStatus === "found"
      ? [{ requestId, status: "found", facts: { predefined: [{ name: "Основной" }] } }]
      : [{ requestId, status: "ambiguous" }],
  }

  return resolveImportedMetadataTargetStatus({
    canonical,
    componentPath: "cf",
    projectDir: "/project",
    queryPort,
    getContributor: params.getContributor ?? (() => ({ target }) => ({
      ok: target.valueKind === "predefinedValue" && target.valueName === "Основной",
      diagnostics: [],
    })),
  })
}
