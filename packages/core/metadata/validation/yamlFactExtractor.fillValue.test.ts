import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import {
  registerDependentYamlItemHandler,
  restoreDependentItemRegistryForTests,
  snapshotDependentItemRegistryForTests,
  type DependentItemRegistrySnapshot,
  type DependentYamlItemParams,
} from "../ruleRuntime/property/dependentItemRegistry"
import { registerCoreMetadata } from "../composition/coreMetadata"
import { resolveValidationProjectFile } from "./projectFiles"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { extractValidationYamlFacts } from "./yamlFactExtractor"

registerCoreMetadata()

describe("dependent fill value validation", () => {
  let registry: DependentItemRegistrySnapshot

  beforeEach(() => {
    registry = snapshotDependentItemRegistryForTests()
  })

  afterEach(() => restoreDependentItemRegistryForTests(registry))

  it("visits each nested item with its name, paths and root values", () => {
    const analyze = vi.fn((_params: DependentYamlItemParams) => ({ diagnostics: [], references: [] }))
    registerDependentYamlItemHandler("MetadataAttribute", analyze)
    const parsed = parseMetadataYaml("Реквизиты:\n  Артикул:\n    Тип: Строка\n")

    extractValidationYamlFacts({
      file: catalogFile(),
      parsed,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(analyze).toHaveBeenCalledOnce()
    expect(analyze.mock.calls[0]?.[0]).toMatchObject({
      itemType: "MetadataAttribute",
      itemName: "Артикул",
      item: { Тип: "Строка" },
      itemYamlPath: ["Реквизиты", "Артикул"],
      rootYaml: parsed.data,
      rootRule: expect.objectContaining({ itemType: "MetadataCatalog" }),
    })
  })

  it("reports one semantic error for an explicitly stored implicit value", () => {
    const facts = extractValidationYamlFacts({
      file: catalogFile(),
      parsed: parseMetadataYaml('Реквизиты:\n  Артикул:\n    Тип: Строка(250)\n    ЗначениеЗаполнения: ""\n'),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.diagnostics.filter(({ path }) => path === "/Реквизиты/Артикул/ЗначениеЗаполнения")).toEqual([
      expect.objectContaining({
        severity: "error",
        message: expect.stringContaining("неявное значение"),
      }),
    ])
  })

  it.each([
    ["01.01.0001 00:00:00", true],
    ["09.08.2026 12:30:00", false],
  ] as const)("проверяет явно записанную дату %s", (value, expectsError) => {
    const facts = extractValidationYamlFacts({
      file: catalogFile(),
      parsed: parseMetadataYaml(`Реквизиты:\n  Момент:\n    Тип: ДатаВремя\n    ЗначениеЗаполнения: ${value}\n`),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    const diagnostics = facts.diagnostics.filter(
      ({ path }) => path === "/Реквизиты/Момент/ЗначениеЗаполнения",
    )
    if (expectsError) {
      expect(diagnostics).toEqual([
        expect.objectContaining({ severity: "error", message: expect.stringContaining("неявное значение") }),
      ])
    } else {
      expect(diagnostics).toEqual([])
    }
  })

  it.each([
    ["invalid ordinary", "Тип: Строка(10)\n    ЗначениеЗаполнения: !xml 1", false],
    ["valid ordinary", "Тип: Строка(10)\n    ЗначениеЗаполнения: !xml текст", true],
    ["implicit ordinary", "Тип: Строка(10)\n    ЗначениеЗаполнения: !xml", true],
    ["unresolved ordinary", "Тип: НеизвестныйТип\n    ЗначениеЗаполнения: !xml текст", true],
  ] as const)("checks %s", (_name, body, expectsTagError) => {
    const diagnostics = extractAttributeDiagnostics(body)
    expect(diagnostics.some(({ message }) => message.includes("!xml"))).toBe(expectsTagError)
  })

  it.each(["!xml", "!xml Ложь", "!xml произвольный-текст"])(
    "разрешает forbidden-значение %s только как XML-исключение",
    (value) => {
      expect(extractStandardAttributeDiagnostics("Предопределенный", value)).toEqual([])
    },
  )

  it("отклоняет forbidden-значение без XML-тега", () => {
    expect(extractStandardAttributeDiagnostics("Предопределенный", "Ложь")).toEqual([
      expect.objectContaining({ severity: "error", message: expect.stringContaining("запрещено") }),
    ])
  })

  it("отклоняет !xml для стандартного реквизита без политики", () => {
    expect(extractStandardAttributeDiagnostics("Наименование", "!xml текст")).toEqual([
      expect.objectContaining({ severity: "error", message: expect.stringContaining("!xml") }),
    ])
  })
})

function extractAttributeDiagnostics(body: string) {
  const facts = extractValidationYamlFacts({
    file: catalogFile(),
    parsed: parseMetadataYaml(`Реквизиты:\n  Тест:\n    ${body}\n`),
    rulesSnapshot: createValidationRulesSnapshot(mockContext),
  })
  return facts.diagnostics.filter(({ path }) => path === "/Реквизиты/Тест/ЗначениеЗаполнения")
}

function extractStandardAttributeDiagnostics(name: string, value: string) {
  const facts = extractValidationYamlFacts({
    file: catalogFile(),
    parsed: parseMetadataYaml(
      `СтандартныеРеквизиты:\n  ${name}:\n    ЗначениеЗаполнения: ${value}\n`,
    ),
    rulesSnapshot: createValidationRulesSnapshot(mockContext),
  })
  return facts.diagnostics.filter(
    ({ path }) => path === `/СтандартныеРеквизиты/${name}/ЗначениеЗаполнения`,
  )
}

function catalogFile() {
  const file = resolveValidationProjectFile("/project", "/project/Справочник/Товары/Свойства.yaml")
  if (file === undefined) throw new Error("file not resolved")
  return file
}
