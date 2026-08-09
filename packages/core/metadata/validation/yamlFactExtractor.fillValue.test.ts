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

  it("rejects an explicitly stored beginning date", () => {
    const facts = extractValidationYamlFacts({
      file: catalogFile(),
      parsed: parseMetadataYaml(
        "Реквизиты:\n  Момент:\n    Тип: ДатаВремя\n    ЗначениеЗаполнения: 01.01.0001 00:00:00\n"
      ),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.diagnostics.filter(({ path }) => path === "/Реквизиты/Момент/ЗначениеЗаполнения")).toEqual([
      expect.objectContaining({
        severity: "error",
        message: expect.stringContaining("неявное значение"),
      }),
    ])
  })

  it("accepts an explicitly stored meaningful date", () => {
    const facts = extractValidationYamlFacts({
      file: catalogFile(),
      parsed: parseMetadataYaml(
        "Реквизиты:\n  Момент:\n    Тип: ДатаВремя\n    ЗначениеЗаполнения: 09.08.2026 12:30:00\n"
      ),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.diagnostics.filter(({ path }) => path === "/Реквизиты/Момент/ЗначениеЗаполнения")).toEqual([])
  })
})

function catalogFile() {
  const file = resolveValidationProjectFile("/project", "/project/Справочник/Товары/Свойства.yaml")
  if (file === undefined) throw new Error("file not resolved")
  return file
}
