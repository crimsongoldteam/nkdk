import { describe, expect, it } from "vitest"
import { serializeYAMLDocument, yamlScalarTagAt } from "@nkdk/runtime"
import type { OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { collectConditionalAppearanceOccurrences } from "./conditionalAppearanceTraversal"
import { finalizeImportedConditionalAppearanceAnomalies } from "./conditionalAppearanceAnomalies"
import { prepareFormDataPathContextFromYAML } from "./formDataPathContext"
import type { ClientApplicationFormYAML } from "./types"
import { metadataRules } from "../../composition/metadataRules"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../../composition/metadataExecutionContext"

const ownerCache: OwnerMetadataCache = {
  listRefs: () => [],
  get: () => ({ status: "not-found", diagnostics: [] }),
}
const registries = createMetadataExecutionRegistrySets(metadataRules)

describe("finalizeImportedConditionalAppearanceAnomalies", () => {
  it("помечает неразрешимые поля и цели, сохраняя расширенную запись", () => {
    const yaml = {
      Реквизиты: { Число: { Тип: "Число" } },
      Элементы: { ПолеФормы: { Вид: "ПолеВвода" } },
      УсловноеОформлениеРеквизитов: {
        Элементы: [{
          Поля: [
            "ПолеФормы",
            "НеизвестныйЭлемент",
            { Поле: "ДругойЭлемент", Использование: "Истина" },
          ],
          Отбор: { Элементы: [
            { ЛевоеЗначение: ".НеизвестныйИсточник.Поле", ПравоеЗначение: ".Число" },
          ] },
        }],
      },
    } satisfies ClientApplicationFormYAML
    const originals = collectConditionalAppearanceOccurrences(yaml)
    const dataPathContext = prepareFormDataPathContextFromYAML({ yaml, ownerCache })

    withMetadataExecutionRegistrySets(registries, () =>
      finalizeImportedConditionalAppearanceAnomalies({ yaml, originals, dataPathContext, ownerCache }))

    const item = yaml.УсловноеОформлениеРеквизитов.Элементы[0]!
    const comparison = item.Отбор.Элементы[0]!
    expect(yamlScalarTagAt(comparison, "ЛевоеЗначение")).toBe("xml/value")
    expect(yamlScalarTagAt(comparison, "ПравоеЗначение")).toBeUndefined()
    expect(yamlScalarTagAt(item.Поля, 0)).toBeUndefined()
    expect(yamlScalarTagAt(item.Поля, 1)).toBe("xml/reference")
    expect(yamlScalarTagAt(item.Поля[2], "Поле")).toBe("xml/reference")
    expect(item.Поля[2]).toMatchObject({ Использование: "Истина" })

    const text = serializeYAMLDocument(yaml).text
    expect(text).toContain("ЛевоеЗначение: !xml/value НеизвестныйИсточник.Поле")
    expect(text).toContain("- !xml/reference НеизвестныйЭлемент")
    expect(text).toContain("Поле: !xml/reference ДругойЭлемент")
  })

  it("сохраняет исходное внутреннее имя в payload после уточнения YAML", () => {
    const yaml = {
      Реквизиты: { Период: { Тип: "СтандартныйПериод" } },
      УсловноеОформлениеРеквизитов: {
        Элементы: [{ Отбор: { Элементы: [{ ЛевоеЗначение: ".Период.Variant" }] } }],
      },
    } satisfies ClientApplicationFormYAML
    const originals = collectConditionalAppearanceOccurrences(yaml)
    yaml.УсловноеОформлениеРеквизитов.Элементы[0]!.Отбор.Элементы[0]!.ЛевоеЗначение = ".Период.Вариант"
    const dataPathContext = prepareFormDataPathContextFromYAML({ yaml, ownerCache })

    withMetadataExecutionRegistrySets(registries, () =>
      finalizeImportedConditionalAppearanceAnomalies({ yaml, originals, dataPathContext, ownerCache }))

    const comparison = yaml.УсловноеОформлениеРеквизитов.Элементы[0]!.Отбор.Элементы[0]!
    expect(serializeYAMLDocument(yaml).text).toContain("ЛевоеЗначение: !xml/value Период.Variant")
    expect(yamlScalarTagAt(comparison, "ЛевоеЗначение")).toBe("xml/value")
  })
})
