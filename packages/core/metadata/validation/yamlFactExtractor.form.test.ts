import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { resolveValidationProjectFile } from "./projectFiles"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { extractValidationYamlFacts } from "./yamlFactExtractor"

describe("extractValidationYamlFacts form", () => {
  it("строит DataPath checks и equal-name диагностики по YAML формы", () => {
    const projectDir = "/project"
    const filePath = "/project/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml(
        [
          "Реквизиты:",
          "  КакоеТоПоле:",
          "    Тип: Строка",
          "    Заголовок: Какое то поле",
          "Элементы:",
          "  КакоеТоПоле:",
          "    Вид: ПолеВвода",
          "    ПутьКДанным: КакоеТоПоле",
        ].join("\n")
      ),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.pendingChecks).toEqual([
      expect.objectContaining({
        kind: "dataPath",
        value: "КакоеТоПоле",
        location: expect.objectContaining({ path: "/Элементы/КакоеТоПоле/ПутьКДанным" }),
      }),
    ])
    expect(facts.diagnostics).toEqual([
      expect.objectContaining({
        source: "structure",
        path: "/Реквизиты/КакоеТоПоле/Заголовок",
        message: expect.stringContaining('Поле "Заголовок" не нужно указывать'),
      }),
    ])
  })

  it("строит DataPath check внутри single-элемента формы", () => {
    const projectDir = "/project"
    const filePath = "/project/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml(
        [
          "Элементы:",
          "  Таблица:",
          "    Вид: ТаблицаФормы",
          "    ПутьКДанным: Объект.Товары",
          "    КонтекстноеМеню:",
          "      Элементы:",
          "        Открыть:",
          "          Вид: КнопкаКоманднойПанели",
          "          Данные: Объект.Товары.LineNumber",
        ].join("\n")
      ),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.pendingChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "dataPath",
          value: "Объект.Товары.LineNumber",
          location: expect.objectContaining({
            path: "/Элементы/Таблица/КонтекстноеМеню/Элементы/Открыть/Данные",
          }),
          policy: "formDataPath",
        }),
      ])
    )
  })

  it("не формирует DataPath checks и diagnostics в fact-only режиме", () => {
    const projectDir = "/project"
    const filePath = "/project/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml(
        [
          "Реквизиты:",
          "  КакоеТоПоле:",
          "    Тип: Строка",
          "    Заголовок: Какое то поле",
          "Элементы:",
          "  КакоеТоПоле:",
          "    Вид: ПолеВвода",
          "    ПутьКДанным: КакоеТоПоле",
        ].join("\n")
      ),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
      validationDiagnostics: false,
    })

    expect(facts.pendingChecks).toEqual([])
    expect(facts.diagnostics).toEqual([])
  })
})
