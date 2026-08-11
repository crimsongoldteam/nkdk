import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseMetadataYaml } from "@nkdk/runtime"
import { resolveValidationProjectFile } from "./projectFiles"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { extractValidationYamlFacts } from "./yamlFactExtractor"
import type { LocalYamlValueValidator } from "./yamlValueValidationRegistry"
import { diagnosticAtYamlPath } from "./yamlLocations"
import { defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { createValidationRegistrySet } from "./validationRegistrySet"


describe("extractValidationYamlFacts", () => {
  it("запускает локальную проверку для корневого item type", () => {
    const projectDir = "/project"
    const filePath = "/project/Справочник/Товары/Свойства.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")
    const runtime = localValidationRuntime(file.itemType, (params) => [
        diagnosticAtYamlPath({
          filePath: params.filePath,
          parsed: params.parsed,
          path: params.yamlPath,
          severity: "error",
          source: "structure",
          message: `${params.owner.dir}.${params.owner.name}:${String(params.value === params.parsed.data)}`,
        }),
      ])

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml("{}\n"),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
      runtime,
    })

    expect(facts.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "Справочник.Товары:true",
        }),
      ])
    )
    expect(facts.diagnostics.find(({ message }) => message === "Справочник.Товары:true")?.path).toBeUndefined()
  })

  it("запускает локальную проверку присутствующего свойства с его YAML-путём", () => {
    const projectDir = "/project"
    const filePath = "/project/ГруппаКоманд/ПечатьДокумента/Свойства.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")
    const runtime = localValidationRuntime("Picture", (params) => [
        diagnosticAtYamlPath({
          filePath: params.filePath,
          parsed: params.parsed,
          path: params.yamlPath,
          severity: "error",
          source: "structure",
          message: String(params.value),
        }),
      ])

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml("Картинка: ОбщаяКартинка.Печать\n"),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
      runtime,
    })

    expect(facts.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "/Картинка",
          message: "ОбщаяКартинка.Печать",
        }),
      ])
    )
  })

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

  it.each([
    [
      "nested recursive object",
      "/project/Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml",
      "Subsystem.Администрирование.Subsystem.Настройки",
    ],
    [
      "nested file item",
      "/project/ВнешнийИсточникДанных/Источник/Кубы/Куб/Свойства.yaml",
      "ExternalDataSource.Источник.Cube.Куб",
    ],
  ])("uses the topology target for %s", (_case, filePath, canonical) => {
    const projectDir = "/project"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml("{}\n"),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.objectIndexEntries).toEqual([
      expect.objectContaining({
        canonical,
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

    const check = facts.pendingChecks.find((item) => item.kind === "dataPath" && item.value === "Объект.Товары.Артикул")
    if (check?.kind !== "dataPath") throw new Error("Не найдена DataPath-проверка")
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

    const check = facts.pendingChecks.find((item) => item.kind === "dataPath" && item.value === "Объект.Товары.ИндексКартинки")
    if (check?.kind !== "dataPath") throw new Error("Не найдена DataPath-проверка")
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

  it("не сохраняет журнал обхода при сборе validation-фактов", () => {
    const projectDir = "/project"
    const filePath = "/project/Документ/Операция/Свойства.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml("Движения:\n  - РегистрБухгалтерии.Хозрасчетный\n"),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.localIndexes?.metadata.events).toEqual([])
    expect(facts.localIndexes?.metadata.ownerFacts?.["registerRecords"]).toEqual([
      "AccountingRegister.Хозрасчетный",
    ])
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

  it("keeps reference facts while diagnostics are disabled", () => {
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

    expect(facts.pendingReferences).toEqual([
      expect.objectContaining({
        canonical: "CommonPicture.Печать",
        yamlPath: ["Картинка"],
      }),
    ])
    expect(facts.diagnostics).toEqual([])
  })
})

function localValidationRuntime(type: string, validator: LocalYamlValueValidator) {
  const rules = defineMetadataRules({
    ...emptyMetadataRules,
    validation: [{ kind: "localYamlValue", propertyType: type, validate: validator }],
  })
  return createValidationRegistrySet(rules, createRuleRegistrySet(rules))
}
