import { yamlScalarTagAt } from "@nkdk/runtime"
import { describe,expect,it } from "vitest"
import { collectFormDataPathOccurrencesFromYAML } from "../../validation/dataPath/formYamlTraversal"
import type { OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { createFormDataPathIndexFromYAML } from "./formDataPathMetadata"
import { finalizeImportedFormDataPathCompatibility } from "./importDataPathCompatibility"
import { ClientApplicationFormRules } from "./rules"

const ownerCache: OwnerMetadataCache = {
  get: () => ({ status: "not-found", diagnostics: [] }),
  listRefs: () => [],
}

describe("finalizeImportedFormDataPathCompatibility", () => {

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
