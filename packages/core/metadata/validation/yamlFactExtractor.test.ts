import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { resolveValidationProjectFile } from "./projectFiles"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { extractValidationYamlFacts } from "./yamlFactExtractor"

describe("extractValidationYamlFacts", () => {
  it("extracts object index entries from properties YAML without model import", () => {
    const projectDir = join(__dirname, "__fixtures__/project-with-form")
    const filePath = join(projectDir, "Справочник/СправочникСФормой/Свойства.yaml")
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")
    const parsed = parseMetadataYaml(readFileSync(filePath, "utf8"))

    const facts = extractValidationYamlFacts({
      file,
      parsed,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.objectIndexEntries).toEqual([
      expect.objectContaining({
        canonical: "Catalog.СправочникСФормой",
        result: expect.objectContaining({ ok: true, filePath }),
      }),
    ])
  })

  it("extracts object index entries for nested recursive objects", () => {
    const projectDir = "/project"
    const filePath = "/project/Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml("{}\n"),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.objectIndexEntries).toEqual([
      expect.objectContaining({
        canonical: "Subsystem.Администрирование.Subsystem.Настройки",
      }),
    ])
  })

  it("extracts form additional columns for data path checks", () => {
    const projectDir = "/project"
    const filePath = "/project/Документ/Заказ/Формы/ФормаДокумента/Форма.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml(
        [
          "Реквизиты:",
          "  Объект:",
          "    Тип: ДокументОбъект.Заказ",
          "    ДополнительныеКолонки:",
          "      Объект.Товары:",
          "        Артикул:",
          "          Тип: Строка",
          "Элементы:",
          "  Артикул:",
          "    Вид: ПолеВвода",
          "    ПутьКДанным: Объект.Товары.Артикул",
        ].join("\n")
      ),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    const check = facts.pendingChecks.find((item) => item.value === "Объект.Товары.Артикул")
    expect(check?.index.additionalColumnsByTablePath.get("Объект.Товары")?.get("Артикул")).toEqual(
      expect.objectContaining({
        name: "Артикул",
        typeInfo: expect.objectContaining({ sourceText: "string" }),
      })
    )
  })
})
