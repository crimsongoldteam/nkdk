import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { beforeAll, describe, expect, it } from "vitest"
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
import { createPropertyStateCapabilityRegistry } from "../appliedObjects/configurationExtension/propertyStateCapabilities"
import { configurationExtensionPropertyStateCapabilities } from "../appliedObjects/configurationExtension/propertyStateRules"

let rulesSnapshot: ReturnType<typeof createValidationRulesSnapshot>

beforeAll(() => {
  rulesSnapshot = createValidationRulesSnapshot(mockContext)
})


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
      rulesSnapshot,
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
    const filePath = "/project/ГруппаКоманд/ПечатьДокумента.yaml"
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
      rulesSnapshot,
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
      rulesSnapshot,
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
      rulesSnapshot,
    })

    expect(facts.objectIndexEntries).toEqual([
      expect.objectContaining({
        canonical,
      }),
    ])
  })

  it("не проверяет перенесённый битый элемент состава подсистемы как metadata target", () => {
    const facts = subsystemCompositionFacts("!xml 6f583fdc-08d4-45d8-9dd0-45aaff4cb2f4")

    expect(facts.diagnostics).toEqual([])
    expect(facts.pendingReferences).toEqual([
      expect.objectContaining({
        canonical: "CommonForm.ОценитьПриложение",
        yamlPath: ["Состав", 0],
      }),
    ])
  })

  it.each([
    ["нетегированный UUID", "6f583fdc-08d4-45d8-9dd0-45aaff4cb2f4", "6f583fdc-08d4-45d8-9dd0-45aaff4cb2f4"],
    ["нераспознанный !xml", "!xml не-uuid", "!xml не-uuid"],
  ])("сохраняет диагностику для %s в составе подсистемы", (_name, value, root) => {
    const facts = subsystemCompositionFacts(value)

    expect(facts.diagnostics).toEqual([
      expect.objectContaining({
        path: "/Состав/1",
        message: `Неизвестный корень "${root}"`,
      }),
    ])
    expect(facts.pendingReferences).toEqual([
      expect.objectContaining({
        canonical: "CommonForm.ОценитьПриложение",
        yamlPath: ["Состав", 0],
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
      rulesSnapshot,
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
      rulesSnapshot,
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
    const filePath = "/project/ГруппаКоманд/ПечатьДокумента.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml("Картинка: Печать\n"),
      rulesSnapshot,
    })

    expect(facts.pendingReferences).toEqual([])
  })

  it("collects explicitly prefixed common picture references", () => {
    const projectDir = "/project"
    const filePath = "/project/ГруппаКоманд/ПечатьДокумента.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml("Картинка: ОбщаяКартинка.Печать\n"),
      rulesSnapshot,
    })

    expect(facts.pendingReferences).toEqual([
      expect.objectContaining({
        canonical: "CommonPicture.Печать",
        yamlPath: ["Картинка"],
      }),
    ])
  })

  it("разрешает краткую форму выбора по типу соседнего реквизита", () => {
    const facts = catalogAttributeFacts([
        "Реквизиты:",
        "  Поставщик:",
        "    Тип: Справочник.Поставщики",
        "    ФормаВыбора: ФормаВыбора",
    ])

    expect(facts.pendingReferences).toEqual(expect.arrayContaining([
      expect.objectContaining({
        canonical: "Catalog.Поставщики.Form.ФормаВыбора",
        yamlPath: ["Реквизиты", "Поставщик", "ФормаВыбора"],
      }),
    ]))
    expect(facts.diagnostics).toEqual([])
  })

  it("сообщает, что форма выбора недоступна для составного типа реквизита", () => {
    const facts = catalogAttributeFacts([
        "Реквизиты:",
        "  Поставщик:",
        "    Тип:",
        "      - Справочник.Поставщики",
        "      - Справочник.Контрагенты",
        "    ФормаВыбора: ФормаВыбора",
    ])

    expect(facts.pendingReferences).not.toEqual(expect.arrayContaining([
      expect.objectContaining({
        yamlPath: ["Реквизиты", "Поставщик", "ФормаВыбора"],
      }),
    ]))
    expect(facts.diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        source: "reference",
        message: 'Свойство "ФормаВыбора" недоступно для реквизита с составным типом',
      }),
    ])
  })

  it("не проверяет существование целей с режимом translateOnly", () => {
    const projectDir = "/project"
    const filePath = "/project/Справочник/Товары/Свойства.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml([
        "Характеристики:",
        "  - ВидыХарактеристик: Справочник.Товары.ТабличнаяЧасть.Виды",
        "    ПолеКлюча: Справочник.Товары.ТабличнаяЧасть.Виды.СтандартныйРеквизит.Ссылка",
      ].join("\n")),
      rulesSnapshot,
    })

    expect(facts.pendingReferences).toEqual([])
    expect(facts.diagnostics).toEqual([])
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
      rulesSnapshot,
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
      rulesSnapshot,
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
      rulesSnapshot,
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
      rulesSnapshot,
      validationDiagnostics: false,
    })

    expect(facts.objectIndexEntries).toEqual([
      expect.objectContaining({ canonical: "Catalog.Товары" }),
    ])
    expect(facts.diagnostics).toEqual([])
  })

  it("keeps reference facts while diagnostics are disabled", () => {
    const projectDir = "/project"
    const filePath = "/project/ГруппаКоманд/ПечатьДокумента.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml("Картинка: ОбщаяКартинка.Печать\n"),
      rulesSnapshot,
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

  it("сохраняет размещение и тип для проверки состава функциональной опции", () => {
    const projectDir = "/project"
    const filePath = "/project/ФункциональнаяОпция/Опция.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml("Размещение: Constant.Флаг\nТип: Булево\n"),
      rulesSnapshot,
      validationDiagnostics: false,
    })
    const structure = facts.structuredDocuments?.find(({ documentKind }) =>
      documentKind === "configurationExtensionStructure")

    expect(JSON.parse(structure?.payload ?? "null")).toMatchObject({
      location: "Constant.Флаг",
      valueType: "Булево",
    })
  })

  it("сохраняет PropertyState и структуру вложенных metadata-объектов", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-facts-"))
    const componentDir = join(projectDir, "cfe", "Расширение")
    const projectPath = "Справочник/Товары/Свойства.yaml"
    const filePath = join(componentDir, projectPath)
    const baseFilePath = join(projectDir, "cf", projectPath)
    mkdirSync(join(componentDir, "Справочник", "Товары"), { recursive: true })
    mkdirSync(join(projectDir, "cf", "Справочник", "Товары"), { recursive: true })
    writeFileSync(baseFilePath, "Комментарий: исходный\n")
    const resolvedFile = resolveValidationProjectFile(componentDir, filePath)
    if (resolvedFile === undefined) throw new Error("file not resolved")
    const file = {
      ...resolvedFile,
      componentPath: "cfe/Расширение",
      componentDir,
    }
    const baseRuntime = localValidationRuntime("unused", () => [])
    const runtime = {
      ...baseRuntime,
      propertyStates: createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities),
    }

    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml([
        "ТабличныеЧасти:",
        "  Строки:",
        "    Подсказка: Строки",
        "    ДлинаНомераСтроки: 9",
        "",
      ].join("\n")),
      rulesSnapshot,
      runtime,
      validationDiagnostics: false,
    })

    expect(facts.structuredDocuments).toEqual(expect.arrayContaining([
      expect.objectContaining({
        documentKind: "configurationExtensionPropertyState",
        logicalAddress: "Справочник.Товары.TabularSection.Строки",
        name: "toolTip",
        yamlPath: ["ТабличныеЧасти", "Строки", "Подсказка"],
      }),
      expect.objectContaining({
        documentKind: "configurationExtensionStructure",
        logicalAddress: "Справочник.Товары.TabularSection.Строки",
        name: "MetadataTabularSection",
        yamlPath: ["ТабличныеЧасти", "Строки"],
      }),
    ]))
    const section = facts.structuredDocuments?.find(({ name }) => name === "MetadataTabularSection")
    expect(JSON.parse(section?.payload ?? "null")).toMatchObject({ lineNumberLength: 9 })
  })

  it("помечает обычную ссылку многорежимного свойства как control", () => {
    const facts = extractDocumentExtensionFacts("Нумератор: Собственный\n")

    expect(facts.pendingReferences).toEqual([
      expect.objectContaining({
        canonical: "DocumentNumerator.Собственный",
        propertyStateMode: "control",
      }),
    ])
  })

  it("не назначает PropertyState ссылкам собственного свойства заимствованного объекта", () => {
    const facts = extractDocumentExtensionFacts("Движения:\n  - РегистрНакопления.Собственный\n")

    expect(facts.pendingReferences).toEqual([
      expect.not.objectContaining({ propertyStateMode: expect.anything() }),
    ])
  })

  function extractDocumentExtensionFacts(yaml: string) {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-facts-"))
    const componentDir = join(projectDir, "cfe", "Расширение")
    const projectPath = "Документ/Заказ/Свойства.yaml"
    const filePath = join(componentDir, projectPath)
    mkdirSync(join(componentDir, "Документ", "Заказ"), { recursive: true })
    mkdirSync(join(projectDir, "cf", "Документ", "Заказ"), { recursive: true })
    writeFileSync(join(projectDir, "cf", projectPath), "Комментарий: исходный\n")
    const resolvedFile = resolveValidationProjectFile(componentDir, filePath)
    if (resolvedFile === undefined) throw new Error("file not resolved")
    const runtime = {
      ...localValidationRuntime("unused", () => []),
      propertyStates: createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities),
    }

    return extractValidationYamlFacts({
      file: { ...resolvedFile, componentPath: "cfe/Расширение", componentDir },
      parsed: parseMetadataYaml(yaml),
      rulesSnapshot,
      runtime,
      validationDiagnostics: false,
    })
  }
})

function catalogAttributeFacts(lines: readonly string[]) {
  const projectDir = "/project"
  const file = resolveValidationProjectFile(projectDir, `${projectDir}/Справочник/Товары/Свойства.yaml`)
  if (file === undefined) throw new Error("file not resolved")
  return extractValidationYamlFacts({
    file,
    parsed: parseMetadataYaml(lines.join("\n")),
    rulesSnapshot,
  })
}

function subsystemCompositionFacts(brokenValue: string) {
  const projectDir = "/project"
  const filePath = "/project/Подсистема/ОбщийФункционал/Подсистемы/ОбратнаяСвязь/Свойства.yaml"
  const file = resolveValidationProjectFile(projectDir, filePath)
  if (file === undefined) throw new Error("file not resolved")
  return extractValidationYamlFacts({
    file,
    parsed: parseMetadataYaml([
      "Состав:",
      "  - ОбщаяФорма.ОценитьПриложение",
      `  - ${brokenValue}`,
    ].join("\n")),
    rulesSnapshot,
  })
}

function localValidationRuntime(type: string, validator: LocalYamlValueValidator) {
  const rules = defineMetadataRules({
    ...emptyMetadataRules,
    validation: [{ kind: "localYamlValue", propertyType: type, validate: validator }],
  })
  return createValidationRegistrySet(rules, createRuleRegistrySet(rules))
}
