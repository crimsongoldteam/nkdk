import { describe, expect, it } from "vitest"
import { selectReadyImportedIssueDecisions } from "./semanticBoundary"

const decision = {
  kind: "invalid" as const,
  target: { kind: "path" as const, path: ["Путь"] },
  issueCodes: ["data-path.unresolved"],
}

describe("semanticBoundary", () => {
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
})
