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
        yamlPath: ["Элементы", "КакоеТоПоле", "ПутьКДанным"],
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
})
