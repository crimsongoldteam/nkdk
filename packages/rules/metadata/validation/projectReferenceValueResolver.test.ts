import type { MetadataRootName, ParsedMetadataTarget } from "@nkdk/runtime/rule-kit"
import { describe, expect, it, vi } from "vitest"
import { createNamedValueReference } from "../appliedObjects/namedValueReference"
import type {
  ProjectOwnerLookup,
  ProjectOwnerLookupResult,
} from "../projectState/contracts/dependencyValidation"
import type { ProjectReferenceValueContributor } from "./projectReferenceIndexRegistry"
import { resolveProjectValueTargets } from "./projectReferenceValueResolver"

const contributors = new Map<MetadataRootName, ProjectReferenceValueContributor>([
  ["Catalog", createNamedValueReference("predefined")],
  ["Enum", createNamedValueReference("enumValues")],
])

describe("разрешение значений проекта по сведениям владельца", () => {
  it("разрешает предопределённое значение, значение перечисления и пустую ссылку одним пакетом", () => {
    const readOwners = vi.fn((requests: readonly ProjectOwnerLookup[]): readonly ProjectOwnerLookupResult[] =>
      requests.map(({ requestId, owner }) => ({
        requestId,
        status: "found" as const,
        facts: owner.kind === "Справочник"
          ? { predefined: [{ name: "Основной" }] }
          : { enumValues: [{ name: "Новый" }] },
      })),
    )

    expect(resolveProjectValueTargets({
      requests: [
        valueRequest("predefined", predefinedTarget("Catalog", "Товары", "Основной")),
        valueRequest("enum", enumTarget("Enum", "Статусы", "Новый")),
        valueRequest("empty", emptyRefTarget("Catalog", "Товары")),
      ],
      projectDir: "/project",
      queryPort: { readOwners },
      getContributor: (root) => contributors.get(root),
    })).toEqual([
      { requestId: "predefined", status: "found" },
      { requestId: "enum", status: "found" },
      { requestId: "empty", status: "found" },
    ])
    expect(readOwners).toHaveBeenCalledTimes(1)
    expect(readOwners).toHaveBeenCalledWith([
      expect.objectContaining({ requestId: "predefined", owner: { kind: "Справочник", name: "Товары" } }),
      expect.objectContaining({ requestId: "enum", owner: { kind: "Перечисление", name: "Статусы" } }),
      expect.objectContaining({ requestId: "empty", owner: { kind: "Справочник", name: "Товары" } }),
    ])
  })

  it("возвращает missing для неизвестного значения существующего владельца", () => {
    expect(resolveSingle({
      target: predefinedTarget("Catalog", "Товары", "НетТакого"),
      ownerResult: { requestId: "value", status: "found", facts: { predefined: [] } },
    })).toEqual({ requestId: "value", status: "missing" })
  })

  it.each(["missing", "ambiguous"] as const)(
    "сохраняет состояние %s поиска владельца",
    (status) => {
      expect(resolveSingle({
        target: predefinedTarget("Catalog", "Товары", "Основной"),
        ownerResult: { requestId: "value", status },
      })).toEqual({ requestId: "value", status })
    },
  )

  it("возвращает сообщения несовместимого значения без изменений", () => {
    const diagnostic = {
      filePath: "/project/Справочник/Товары/Свойства.yaml",
      line: 1,
      col: 1,
      severity: "error" as const,
      source: "reference" as const,
      message: "Значение несовместимо",
    }

    expect(resolveProjectValueTargets({
      requests: [valueRequest("invalid", predefinedTarget("Catalog", "Товары", "Основной"))],
      projectDir: "/project",
      queryPort: {
        readOwners: () => [{ requestId: "invalid", status: "found", facts: {} }],
      },
      getContributor: () => () => ({ ok: false, diagnostics: [diagnostic] }),
    })).toEqual([{ requestId: "invalid", status: "invalid", diagnostics: [diagnostic] }])
  })
})

function resolveSingle(params: {
  readonly target: Extract<ParsedMetadataTarget, { kind: "value" }>
  readonly ownerResult: ProjectOwnerLookupResult
}) {
  return resolveProjectValueTargets({
    requests: [valueRequest("value", params.target)],
    projectDir: "/project",
    queryPort: { readOwners: () => [params.ownerResult] },
    getContributor: (root) => contributors.get(root),
  })[0]
}

function valueRequest(
  requestId: string,
  target: Extract<ParsedMetadataTarget, { kind: "value" }>,
) {
  return { requestId, componentPath: "cf", target }
}

function predefinedTarget(
  root: "Catalog",
  objectName: string,
  valueName: string,
): Extract<ParsedMetadataTarget, { kind: "value" }> {
  return { kind: "value", root, objectName, valueKind: "predefinedValue", valueName }
}

function enumTarget(
  root: "Enum",
  objectName: string,
  valueName: string,
): Extract<ParsedMetadataTarget, { kind: "value" }> {
  return { kind: "value", root, objectName, valueKind: "enumValue", valueName }
}

function emptyRefTarget(
  root: "Catalog",
  objectName: string,
): Extract<ParsedMetadataTarget, { kind: "value" }> {
  return { kind: "value", root, objectName, valueKind: "emptyRef" }
}
