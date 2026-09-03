import { describe, expect, it } from "vitest"
import type { ImportedIssueDecision } from "./classifyImportedIssues"
import {
  portableFirstPassIssueDecision,
  normalizeImportedIssueDecisionPath,
  selectImportedIssueDecisionsForBoundary,
  selectReadyImportedIssueDecisions,
} from "./semanticBoundary"

const decision = {
  kind: "invalid" as const,
  target: { kind: "path" as const, path: ["Путь"] },
  issueCodes: ["data-path.unresolved"],
}

describe("semanticBoundary", () => {
  it("переносит решение первого прохода на самую глубокую готовую границу", () => {
    const source = {
      kind: "invalid" as const,
      target: { kind: "path" as const, path: ["Элементы", 0, "Путь"] },
      issueCodes: ["diagnostic.structure"],
    }

    expect(selectImportedIssueDecisionsForBoundary({
      data: { Путь: "Объект" },
      yamlPath: ["Элементы", 0],
      decisions: [source],
    })).toEqual([{
      source,
      local: { ...source, target: { kind: "path", path: ["Путь"] } },
    }])
    expect(selectImportedIssueDecisionsForBoundary({
      data: { Другое: true },
      yamlPath: ["Элементы", 1],
      decisions: [source],
    })).toEqual([])
  })

  it("сохраняет решение для всё ещё неразрешённого пути", () => {
    expect(selectReadyImportedIssueDecisions({
      data: { Путь: "Объект.Неизвестное" }, decisions: [decision],
      diagnostics: [{
        severity: "warning", code: "unresolved_data_path", message: "не разрешён",
        targetProjectPath: "Форма.yaml", value: "Объект.Неизвестное",
      }],
    })).toEqual([decision])
  })

  it("отбрасывает устаревшее решение после разрешения пути", () => {
    expect(selectReadyImportedIssueDecisions({
      data: { Путь: "Объект.Товары.НомерСтроки" }, decisions: [decision], diagnostics: [],
    })).toEqual([])
  })

  it("не переносит локальные решения первого прохода", () => {
    const localCodes = [
      "schema.anyOf",
      "rules.unknown-property",
      "xml/anomaly-tag-unnecessary",
      "diagnostic.structure",
    ]
    expect(localCodes.map((code) => portableFirstPassIssueDecision({
      kind: "invalid",
      target: { kind: "path", path: ["Поле"] },
      issueCodes: [code],
    }))).toEqual([undefined, undefined, undefined, undefined])
    expect(portableFirstPassIssueDecision(decision)).toEqual(decision)
  })

  it("удаляет локальный код из смешанного решения", () => {
    expect(portableFirstPassIssueDecision({
      ...decision,
      issueCodes: ["diagnostic.structure", "diagnostic.reference"],
    })?.issueCodes).toEqual(["diagnostic.reference"])
  })

  it("заменяет индекс именованной коллекции окончательным ключом", () => {
    const indexed: ImportedIssueDecision = {
      kind: "invalid",
      target: { kind: "path", path: ["Элементы", 1, "Путь"] },
      issueCodes: ["data-path.unresolved"],
    }
    expect(normalizeImportedIssueDecisionPath({
      Элементы: {
        Первый: { Путь: "A" },
        Второй: { Путь: "B" },
      },
    }, indexed).target.path).toEqual(["Элементы", "Второй", "Путь"])
  })
})
