import { describe, expect, it } from "vitest"
import type { ProjectStateStructuredDocumentFact } from "../../projectState/contracts/dependencyValidation"
import type { ProjectStateStructuredDocumentEntry } from "../../projectState/fileUpdate"
import {
  CONFIGURATION_EXTENSION_PROPERTY_STATE_DOCUMENT,
  type ConfigurationExtensionPropertyStateFactPayload,
} from "../../ruleRuntime/property/propertyStateFacts"
import { validateConfigurationExtensionPropertyStates } from "./propertyStateValidation"
import { configurationExtensionStructureDocument } from "../../ruleRuntime/property/configurationExtensionStructureFacts"

describe("configuration extension PropertyState validation", () => {
  const externalFileFact = (mode: ConfigurationExtensionPropertyStateFactPayload["mode"]) =>
    fact("cfe/X", entry(payload(mode, { externalProjectPath: "Пакет/Package.bin" })))
  const baseExternalFile = entry(payload("control", { externalProjectPath: "Пакет/Package.bin" }))
  it.each([
    ["control", 2, "error"],
    ["notify", 2, "warning"],
    ["extend", 2, undefined],
    ["xml", 2, undefined],
    ["control", 1, undefined],
  ] as const)("validates %s mode", (mode, extensionValue, severity) => {
    const extension = fact("cfe/X", entry(payload(mode, extensionValue)))
    const base = entry(payload("control", 1))
    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [extension],
      projectDir: "/project",
      queryPort: queryPort([base]),
    })

    expect(diagnostics.map((diagnostic) => diagnostic.severity)).toEqual(
      severity === undefined ? [] : [severity],
    )
  })

  it("reports a missing base property", () => {
    const missing = { ...payload("extend", 2), explicitMode: true } as const
    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [fact("cfe/X", entry(missing))],
      projectDir: "/project",
      queryPort: queryPort([]),
    })

    expect(diagnostics).toEqual([expect.objectContaining({
      filePath: "cfe/X/Пример/Один/Свойства.yaml",
      severity: "error",
      message: expect.stringContaining("основной конфигурации"),
      path: "/Поле",
    })])
  })

  it("validates MultiState parts independently", () => {
    const extension = payload("multi", [
      { mode: "control", value: "Число" },
      { mode: "notify", value: "Дата" },
      { mode: "extend", value: "Булево" },
    ])
    const base = payload("multi", [{ mode: "control", value: "Строка" }])
    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [fact("cfe/X", entry(extension))],
      projectDir: "/project",
      queryPort: queryPort([entry(base)]),
    })

    expect(diagnostics.map(({ severity }) => severity)).toEqual(["error", "warning"])
  })

  it.each([
    ["control", "error"],
    ["notify", "warning"],
  ] as const)("проверяет режим %s предопределённого элемента", (mode, severity) => {
    const extension = predefinedEntry({
      Группа: { mode, value: { Код: "000000009", Элементы: {} } },
    })
    const base = predefinedEntry({
      Группа: { Код: "000000003", Элементы: {} },
    })

    const diagnostics = validatePredefined(extension, base)

    expect(diagnostics).toEqual([expect.objectContaining({
      filePath: "cfe/X/Пример/Один/Свойства.yaml",
      severity,
      path: "/Предопределенные/Группа",
    })])
  })

  it("проверяет вложенный предопределённый элемент отдельно от группы", () => {
    const extension = predefinedEntry({
      Группа: {
        Код: "000000003",
        Элементы: { Вложенный: { mode: "control", value: { Код: "000000009" } } },
      },
    })
    const base = predefinedEntry({
      Группа: {
        Код: "000000003",
        Элементы: { Вложенный: { Код: "000000004" } },
      },
    })

    const diagnostics = validatePredefined(extension, base)

    expect(diagnostics).toEqual([expect.objectContaining({
      severity: "error",
      path: "/Предопределенные/Группа/Элементы/Вложенный",
    })])
  })

  it("различает собственный и потерянный заимствованный предопределённый элемент", () => {
    const own = predefinedEntry({ Собственный: { Код: "000000005" } })
    const missingBorrowed = predefinedEntry({
      Потерянный: { mode: "control", value: { Код: "000000006" } },
    })

    const base = predefinedEntry({})
    const ownDiagnostics = validatePredefined(own, base)
    const missingDiagnostics = validatePredefined(missingBorrowed, base)

    expect(ownDiagnostics).toEqual([])
    expect(missingDiagnostics).toEqual([expect.objectContaining({
      severity: "error",
      path: "/Предопределенные/Потерянный",
    })])
  })

  it("отклоняет режим изменения предопределённого элемента", () => {
    const extension = predefinedEntry({
      Группа: { mode: "extend", value: { Код: "000000003" } },
    })
    const diagnostics = validatePredefined(
      extension,
      predefinedEntry({ Группа: { Код: "000000003" } }),
    )

    expect(diagnostics).toEqual([expect.objectContaining({
      severity: "error",
      path: "/Предопределенные/Группа",
    })])
  })

  it("контролирует использование и авторегистрацию элемента состава плана обмена", () => {
    const extension = exchangeContentEntry([
      exchangeItem("Документ.Заказ", "control", false, "Разрешить"),
    ])
    const base = exchangeContentEntry([
      exchangeItem("Документ.Заказ", "control", true, "Разрешить"),
    ])

    expect(validatePredefined(extension, base)).toEqual([expect.objectContaining({
      filePath: "cfe/X/Пример/Один/Свойства.yaml",
      severity: "error",
      path: "/Состав/0",
    })])
  })

  it.each([
    ["extend", false, false, "error"],
    ["extend", false, true, undefined],
    ["extend", true, true, "error"],
    ["control", true, true, "error"],
  ] as const)("проверяет аномалию состава mode=%s used=%s invalid=%s", (mode, used, invalidUse, severity) => {
    const extension = exchangeContentEntry([
      { ...exchangeItem("Документ.Заказ", mode, used, "Разрешить"), invalidUse },
    ])
    const diagnostics = validatePredefined(extension, exchangeContentEntry([]))

    expect(diagnostics.map((item) => item.severity)).toEqual(severity === undefined ? [] : [severity])
    if (severity !== undefined) expect(diagnostics[0]?.path).toBe("/Состав/0/Использовать")
  })

  it("не сравнивает собственный контролируемый элемент состава с базой", () => {
    const extension = exchangeContentEntry([
      exchangeItem("Документ.СобственныйExt", "control", true, "Разрешить"),
    ])
    expect(validatePredefined(extension, exchangeContentEntry([]))).toEqual([])
  })

  it("считает отсутствующий в базовом составе объект выключенным", () => {
    const extension = exchangeContentEntry([
      exchangeItem("Документ.Заказ", "control", true, "Разрешить"),
    ])
    const baseContent = exchangeContentEntry([])
    const baseObject = configurationExtensionStructureDocument({
      itemType: "MetadataDocument",
      logicalAddress: "Document.Заказ",
      workingProjectPath: "Документ/Заказ/Свойства.yaml",
    })
    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [fact("cfe/X", extension)],
      projectDir: "/project",
      queryPort: {
        ...queryPort([]),
        readStructuredDocumentEntries: ({ logicalAddress }: { logicalAddress: string }) =>
          logicalAddress === "Document.Заказ" ? [baseObject] : [baseContent],
      },
    })

    expect(diagnostics).toEqual([expect.objectContaining({ severity: "error", path: "/Состав/0" })])
  })

  it("uses the extension compatibility mode for the capability matrix", () => {
    const property = fact("cfe/X", entry({
      version: 1,
      itemType: "MetadataCatalog",
      propertyKey: "codeLength",
      mode: "extend",
      value: 10,
    }))
    const root = fact("cfe/X", configurationExtensionStructureDocument({
      itemType: "MetadataConfigurationExtension",
      logicalAddress: "Конфигурация",
      workingProjectPath: "Конфигурация.yaml",
      compatibilityMode: "Версия8_3_7",
    }))

    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [root, property],
      projectDir: "/project",
      queryPort: queryPort([entry({
        version: 1,
        itemType: "MetadataCatalog",
        propertyKey: "codeLength",
        mode: "control",
        value: 9,
      })]),
    })

    expect(diagnostics).toEqual([expect.objectContaining({
      severity: "error",
      message: expect.stringContaining("Версия8_3_7"),
    })])
  })

  it.each([
    ["control", 2n, "error"],
    ["notify", 2n, "warning"],
    ["extend", 2n, undefined],
    ["control", 1n, undefined],
  ] as const)("validates an external file in %s mode", (mode, extensionHash, severity) => {
    const extension = externalFileFact(mode)
    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [extension],
      projectDir: "/project",
      queryPort: {
        ...queryPort([baseExternalFile]),
        readFileHash: ({ componentPath }: { componentPath: string }) => componentPath === "cf" ? 1n : extensionHash,
      },
    })
    expect(diagnostics.map(({ severity: actual }) => actual)).toEqual(severity === undefined ? [] : [severity])
  })

  it("requires the external file named in a section", () => {
    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [externalFileFact("extend")], projectDir: "/project",
      queryPort: { ...queryPort([baseExternalFile]), readFileHash: () => undefined },
    })
    expect(diagnostics).toEqual([expect.objectContaining({ severity: "error", message: expect.stringContaining("Отсутствует") })])
  })

  it.each([
    ["Булево", 0],
    ["Строка(10)", 1],
  ] as const)("validates functional-option content by the location type %s", (type, diagnosticCount) => {
    const logicalAddress = "FunctionalOption.Опция"
    const extensionEntry = {
      ...entry({
        version: 1,
        itemType: "MetadataFunctionalOption",
        propertyKey: "content",
        mode: "extend",
        value: ["Catalog.Товары"],
      }),
      logicalAddress,
      name: "content",
    }
    const baseProperty = {
      ...entry({
        version: 1,
        itemType: "MetadataFunctionalOption",
        propertyKey: "content",
        mode: "control",
        value: [],
      }),
      logicalAddress,
      name: "content",
    }
    const baseOption = configurationExtensionStructureDocument({
      itemType: "MetadataFunctionalOption",
      logicalAddress,
      workingProjectPath: "ФункциональнаяОпция/Опция.yaml",
      location: "Constant.Флаг",
    })
    const baseLocation = configurationExtensionStructureDocument({
      itemType: "MetadataConstant",
      logicalAddress: "Constant.Флаг",
      workingProjectPath: "Константа/Флаг/Свойства.yaml",
      valueType: type,
    })
    const diagnostics = validateConfigurationExtensionPropertyStates({
      facts: [fact("cfe/X", extensionEntry)],
      projectDir: "/project",
      queryPort: {
        ...queryPort([]),
        readStructuredDocumentEntries: ({ logicalAddress: address }: { logicalAddress: string }) =>
          address === logicalAddress ? [baseProperty, baseOption] : address === "Constant.Флаг" ? [baseLocation] : [],
      },
    })

    expect(diagnostics).toHaveLength(diagnosticCount)
    if (diagnosticCount > 0) expect(diagnostics[0]?.message).toContain("булев")
  })
})

function payload(mode: ConfigurationExtensionPropertyStateFactPayload["mode"], value: unknown) {
  return { version: 1, itemType: "MetadataExample", propertyKey: "field", mode, value } as const
}

function predefinedEntry(value: unknown): ProjectStateStructuredDocumentEntry {
  return {
    ...entry({
      version: 1,
      itemType: "MetadataCatalog",
      propertyKey: "predefined",
      mode: "extend",
      value,
    }),
    name: "predefined",
    yamlPath: ["Предопределенные"],
  }
}

function validatePredefined(
  extension: ProjectStateStructuredDocumentEntry,
  base: ProjectStateStructuredDocumentEntry,
) {
  return validateConfigurationExtensionPropertyStates({
    facts: [fact("cfe/X", extension)],
    projectDir: "/project",
    queryPort: queryPort([base]),
  })
}

function exchangeContentEntry(value: unknown): ProjectStateStructuredDocumentEntry {
  return {
    ...entry({
      version: 1,
      itemType: "MetadataExchangePlan",
      propertyKey: "content",
      mode: "extend",
      value,
    }),
    name: "content",
    yamlPath: ["Состав"],
  }
}

function exchangeItem(
  metadata: string,
  mode: "control" | "extend",
  used: boolean,
  autoRecord: string,
) {
  return { metadata, mode, used, autoRecord, invalidUse: false }
}

function entry(value: ConfigurationExtensionPropertyStateFactPayload): ProjectStateStructuredDocumentEntry {
  return {
    documentKind: CONFIGURATION_EXTENSION_PROPERTY_STATE_DOCUMENT,
    representation: "working",
    logicalAddress: "Example.Один",
    workingProjectPath: "Пример/Один/Свойства.yaml",
    componentKind: "property",
    name: "field",
    yamlPath: ["Поле"],
    payload: JSON.stringify(value),
  }
}

function fact(componentPath: string, value: ProjectStateStructuredDocumentEntry): ProjectStateStructuredDocumentFact {
  return { componentPath, projectPath: `${componentPath}/${value.workingProjectPath}`, entry: value }
}

function queryPort(base: readonly ProjectStateStructuredDocumentEntry[]) {
  return {
    readStructuredDocumentEntries: () => base,
    readDependencyInputs: () => [],
    readDependencyOwnerInputs: () => [],
  }
}
