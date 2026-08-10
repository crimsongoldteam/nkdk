import { describe, expect, it } from "vitest"
import { serializeYAMLDocument } from "@nkdk/runtime"
import { yamlScalarTagAt } from "@nkdk/runtime"
import type { OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { collectFormDataPathOccurrencesFromYAML } from "../../validation/dataPath/formYamlTraversal"
import { ClientApplicationFormRules } from "./rules"
import { createFormDataPathIndexFromYAML } from "./formDataPathMetadata"
import { finalizeImportedFormDataPathCompatibility } from "./importDataPathCompatibility"
import { createLayeredOwnerMetadataCacheForTests } from "../../../tests/layeredOwnerMetadataCache"
import { createValidationOwnerFacts } from "../../validation/dataPath/ownerFacts"
import { buildObjectFieldIndex } from "../../validation/dataPath/objectFields"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"

const ownerCache: OwnerMetadataCache = {
  get: () => ({ status: "not-found", diagnostics: [] }),
  listRefs: () => [],
}

describe("finalizeImportedFormDataPathCompatibility", () => {
  it.each([
    ["ПолеФлажок", "Булево", false],
    ["ПолеФлажок", "Строка", true],
    ["ПолеРисунка", "Число", false],
  ] as const)("классифицирует %s с типом %s", (elementKind, terminalType, expectsTag) => {
    const yaml = formYaml(elementKind, terminalType)
    const originalOccurrences = collectFormDataPathOccurrencesFromYAML({
      yaml,
      rule: ClientApplicationFormRules,
    })

    finalizeImportedFormDataPathCompatibility({
      yaml,
      originalOccurrences,
      index: createFormDataPathIndexFromYAML(yaml),
      ownerCache,
    })

    const element = (yaml.Элементы as Record<string, Record<string, unknown>>).Поле!
    expect(yamlScalarTagAt(element, "ПутьКДанным") === "xml").toBe(expectsTag)
    expect(serializeYAMLDocument(yaml).text.includes("ПутьКДанным: !xml Значение")).toBe(expectsTag)
  })

  it("не помечает неразрешимый путь", () => {
    const yaml = formYaml("ПолеФлажок", "Строка")
    const originalOccurrences = collectFormDataPathOccurrencesFromYAML({ yaml, rule: ClientApplicationFormRules })
    ;(yaml.Элементы.Поле as Record<string, unknown>).ПутьКДанным = "Неизвестное"

    finalizeImportedFormDataPathCompatibility({
      yaml,
      originalOccurrences,
      index: createFormDataPathIndexFromYAML(yaml),
      ownerCache,
    })

    expect(yamlScalarTagAt(yaml.Элементы.Поле, "ПутьКДанным")).toBeUndefined()
  })

  it("возвращает исходное внутреннее имя стандартного реквизита в payload !xml", () => {
    const yaml = {
      Реквизиты: { Объект: { Тип: "СправочникОбъект.СправочникПолный" } },
      Элементы: {
        Поле: { Вид: "ПолеФлажок", ПутьКДанным: "Объект.Description" },
      },
    }
    const originalOccurrences = collectFormDataPathOccurrencesFromYAML({ yaml, rule: ClientApplicationFormRules })
    yaml.Элементы.Поле.ПутьКДанным = "Объект.Наименование"

    finalizeImportedFormDataPathCompatibility({
      yaml,
      originalOccurrences,
      index: createFormDataPathIndexFromYAML(yaml),
      ownerCache: catalogOwnerCache(),
    })

    expect(yaml.Элементы.Поле.ПутьКДанным).toBe("Объект.Description")
    expect(serializeYAMLDocument(yaml).text).toContain("ПутьКДанным: !xml Объект.Description")
  })
})

function formYaml(elementKind: string, terminalType: string) {
  return {
    Реквизиты: { Значение: { Тип: terminalType } },
    Элементы: {
      Поле: {
        Вид: elementKind,
        ПутьКДанным: "Значение",
      },
    },
  }
}

function catalogOwnerCache(): OwnerMetadataCache {
  const ref = { kind: "Справочник", name: "СправочникПолный" }
  const initialFacts = createValidationOwnerFacts({
    ref,
    filePath: "/project/cf/Справочник/СправочникПолный/Свойства.yaml",
    fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
    model: { itemType: "MetadataCatalog" },
  })
  return createLayeredOwnerMetadataCacheForTests({
    base: [{ ...initialFacts, fieldIndex: buildObjectFieldIndex({ ref, facts: initialFacts, rule: MetadataCatalogRules }) }],
  })
}
