import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { resolveValidationProjectFile } from "./projectFiles"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { extractValidationYamlFacts } from "./yamlFactExtractor"
import { registerValidationMetadata } from "./registerValidationMetadata"

registerValidationMetadata()

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

  it("extracts parameterized primitive types for form additional columns", () => {
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
          "        ИндексКартинки:",
          "          Тип: Число(10, 0)",
          "Элементы:",
          "  Картинка:",
          "    Вид: ПолеРисунка",
          "    КартинкаЗначений: ОбщаяКартинка.Состояния",
          "    ПутьКДанным: Объект.Товары.ИндексКартинки",
        ].join("\n")
      ),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    const check = facts.pendingChecks.find((item) => item.value === "Объект.Товары.ИндексКартинки")
    expect(check?.index.additionalColumnsByTablePath.get("Объект.Товары")?.get("ИндексКартинки")).toEqual(
      expect.objectContaining({
        name: "ИндексКартинки",
        typeInfo: expect.objectContaining({ kinds: ["scalar"], sourceText: "decimal" }),
      })
    )
  })

  it("does not collect standard pictures as common picture references", () => {
    const projectDir = "/project"
    const filePath = "/project/ГруппаКоманд/ПечатьДокумента/Свойства.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml("Картинка: Печать\n"),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.pendingReferences).toEqual([])
  })

  it("collects explicitly prefixed common picture references", () => {
    const projectDir = "/project"
    const filePath = "/project/ГруппаКоманд/ПечатьДокумента/Свойства.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml("Картинка: ОбщаяКартинка.Печать\n"),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.pendingReferences).toEqual([
      expect.objectContaining({
        canonical: "CommonPicture.Печать",
        yamlPath: ["Картинка"],
      }),
    ])
  })

  it("extracts document register records from YAML movements", () => {
    const projectDir = "/project"
    const filePath = "/project/Документ/Операция/Свойства.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml(
        [
          "Движения:",
          "  - РегистрБухгалтерии.Хозрасчетный",
          "  - РегистрНакопления.Продажи",
        ].join("\n")
      ),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.localIndexes?.metadata.ownerFacts?.["registerRecords"]).toEqual([
      "AccountingRegister.Хозрасчетный",
      "AccumulationRegister.Продажи",
    ])
  })

  it("extracts accounting register chart of accounts from YAML", () => {
    const projectDir = "/project"
    const filePath = "/project/РегистрБухгалтерии/Хозрасчетный/Свойства.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml("ПланСчетов: ChartOfAccounts.Хозрасчетный\n"),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.localIndexes?.metadata.ownerFacts?.["chartOfAccounts"]).toBe("ChartOfAccounts.Хозрасчетный")
  })

  it("can collect index facts without forming validation diagnostics", () => {
    const projectDir = "/project"
    const filePath = "/project/Справочник/Товары/Свойства.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml(
        [
          "Реквизиты:",
          "  ОбщееИмя:",
          "    Тип: Строка",
          "ТабличныеЧасти:",
          "  ОбщееИмя:",
          "    Реквизиты: {}",
        ].join("\n")
      ),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
      validationDiagnostics: false,
    })

    expect(facts.objectIndexEntries).toEqual([
      expect.objectContaining({ canonical: "Catalog.Товары" }),
    ])
    expect(facts.diagnostics).toEqual([])
  })

  it("does not form pending reference checks in fact-only mode", () => {
    const projectDir = "/project"
    const filePath = "/project/ГруппаКоманд/ПечатьДокумента/Свойства.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml("Картинка: ОбщаяКартинка.Печать\n"),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
      validationDiagnostics: false,
    })

    expect(facts.pendingReferences).toEqual([])
  })
})
