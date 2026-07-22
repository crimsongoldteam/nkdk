import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import type { OwnerMetadataCache } from "./dataPath/ownerCache"
import { resolveValidationProjectFile } from "./projectFiles"
import { validatePendingChecks } from "./projectValidationPendingChecks"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { extractValidationYamlFacts } from "./yamlFactExtractor"

const ownerCache: OwnerMetadataCache = {
  get: () => ({ status: "not-found", diagnostics: [] }),
  listRefs: () => [],
}

describe("validatePendingChecks", () => {
  it.each([
    ["Значение", []],
    [
      "Неизвестное",
      [
        expect.objectContaining({
          source: "structure",
          path: "/Элементы/Поле/КонтекстноеМеню/Элементы/Открыть/Данные",
          message: 'ПутьКДанным "Неизвестное": неизвестный корень "Неизвестное"',
        }),
      ],
    ],
  ])("проверяет DataPath %s внутри single-элемента", (dataPath, expectedDiagnostics) => {
    const projectDir = "/project"
    const filePath = "/project/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")
    const parsed = parseMetadataYaml(
      [
        "Реквизиты:",
        "  Значение:",
        "    Тип: Строка",
        "Элементы:",
        "  Поле:",
        "    Вид: ПолеВвода",
        "    КонтекстноеМеню:",
        "      Элементы:",
        "        Открыть:",
        "          Вид: КнопкаКоманднойПанели",
        `          Данные: ${dataPath}`,
      ].join("\n")
    )
    const facts = extractValidationYamlFacts({
      file,
      parsed,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(JSON.stringify(facts.pendingChecks)).not.toContain("syntaxErrors")
    expect(facts.pendingChecks[0]).not.toHaveProperty("parsed")
    expect(facts.pendingChecks[0]).toHaveProperty(
      "location.path",
      "/Элементы/Поле/КонтекстноеМеню/Элементы/Открыть/Данные"
    )

    expect(validatePendingChecks({ ownerCache, checks: facts.pendingChecks }).diagnostics).toEqual(
      expectedDiagnostics
    )
  })
})
