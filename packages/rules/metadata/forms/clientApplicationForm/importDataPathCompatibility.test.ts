import { yamlScalarTagAt } from "@nkdk/runtime"
import { describe,expect,it } from "vitest"
import { collectFormDataPathOccurrencesFromYAML } from "../../validation/dataPath/formYamlTraversal"
import type { OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { createFormDataPathIndexFromYAML } from "./formDataPathMetadata"
import {
  finalizeImportedFormDataPathCompatibility,
  importedFormDataPathCompatibilityChanges,
  importedFormDataPathCompatibilityChangesFromOccurrences,
} from "./importDataPathCompatibility"
import { ClientApplicationFormRules } from "./rules"

const ownerCache: OwnerMetadataCache = {
  get: () => ({ status: "not-found", diagnostics: [] }),
  listRefs: () => [],
}

describe("finalizeImportedFormDataPathCompatibility", () => {
  it("не перезаписывает уже сохранённый несовместимый путь", () => {
    const yaml = formYaml("ПолеФлажок", "Строка")
    const originalOccurrences = collectFormDataPathOccurrencesFromYAML({ yaml, rule: ClientApplicationFormRules })
    Object.freeze(yaml.Элементы.Поле)
    const params = {
      finalizedYaml: yaml, originalOccurrences,
      index: createFormDataPathIndexFromYAML(yaml), ownerCache,
    }

    expect(importedFormDataPathCompatibilityChanges(params)).toEqual([])
    finalizeImportedFormDataPathCompatibility({ ...params, yaml })
    expect(yaml.Элементы.Поле.ПутьКДанным).toBe("Значение")
  })

  it("возвращает адресное решение до изменения YAML", () => {
    const yaml = {
      Реквизиты: {
        Булево: { Тип: "Булево" },
        Строка: { Тип: "Строка" },
      },
      Элементы: {
        Поле: { Вид: "ПолеФлажок", ПутьКДанным: "Булево" },
      },
    }
    const originalOccurrences = collectFormDataPathOccurrencesFromYAML({
      yaml,
      rule: ClientApplicationFormRules,
    })
    ;(yaml.Элементы.Поле as Record<string, unknown>).ПутьКДанным = "Строка"

    const changes = importedFormDataPathCompatibilityChanges({
      finalizedYaml: yaml,
      originalOccurrences,
      index: createFormDataPathIndexFromYAML(yaml),
      ownerCache,
    })

    expect(changes.map(({ yamlPath, value }) => ({ yamlPath, value }))).toEqual([{
      yamlPath: ["Элементы", "Поле", "ПутьКДанным"],
      value: "Булево",
    }])
    const readonlyOccurrences = collectFormDataPathOccurrencesFromYAML({ yaml, rule: ClientApplicationFormRules })
      .map(({ setValue: _setValue, ...occurrence }) => occurrence)
    expect(importedFormDataPathCompatibilityChangesFromOccurrences({
      finalizedOccurrences: readonlyOccurrences,
      originalOccurrences: originalOccurrences.map(({ setValue: _setValue, ...occurrence }) => occurrence),
      index: createFormDataPathIndexFromYAML(yaml), ownerCache,
    }).map(({ occurrence, value }) => ({ yamlPath: occurrence.yamlPath, value }))).toEqual([{
      yamlPath: ["Элементы", "Поле", "ПутьКДанным"], value: "Булево",
    }])
    expect(yaml.Элементы.Поле.ПутьКДанным).toBe("Строка")
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
