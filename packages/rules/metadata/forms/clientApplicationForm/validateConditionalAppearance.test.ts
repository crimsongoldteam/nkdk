import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "@nkdk/runtime"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../../composition/metadataExecutionContext"
import { metadataRules } from "../../composition/metadataRules"
import type { OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { createFormDataPathIndexFromYAML } from "./formDataPathMetadata"
import type { FormDataPathContext } from "./formDataPathContext"
import { validateFormConditionalAppearance } from "./validateConditionalAppearance"
import { mockContext } from "../../../tests/mockContext"

const registries = createMetadataExecutionRegistrySets(metadataRules)

describe("validateFormConditionalAppearance", () => {
  it("проверяет цели, поля, view и совместимость известных типов", () => {
    const source = [
      "Реквизиты:",
      "  Число:",
      "    Тип: Число",
      "  Период:",
      "    Тип: СтандартныйПериод",
      "Элементы:",
      "  ПолеФормы:",
      "    Вид: ПолеВвода",
      "УсловноеОформлениеРеквизитов:",
      "  Элементы:",
      "    - Поля: [ПолеФормы, НеизвестныйЭлемент]",
      "      Отбор:",
      "        Элементы:",
      "          - ЛевоеЗначение: .Число",
      "            ПравоеЗначение: \"'текст'\"",
      "          - ЛевоеЗначение: .Период.ДатаНачала",
      "            ПравоеЗначение: 01.02.2026 03:04:05",
      "          - ЛевоеЗначение: .Период.Вариант",
      "            ПравоеЗначение: 0",
      "          - ЛевоеЗначение: .Неизвестный",
      "            ПравоеЗначение: Истина",
      "          - ЛевоеЗначение: 0",
      "            ПравоеЗначение: .Число",
      "          - ЛевоеЗначение: Справочник.Номенклатура",
      "            ПравоеЗначение: .Число",
    ].join("\n") + "\n"
    const parsed = parseMetadataYaml(source)
    const yaml = parsed.data as Record<string, unknown>

    const diagnostics = runValidation(parsed, yaml, ["ПолеФормы"])
    const messages = diagnostics.map((item) => item.message)

    expect(messages).toContain('Неизвестный оформляемый элемент формы "НеизвестныйЭлемент".')
    expect(messages).toContainEqual(expect.stringContaining("несовместимы: decimal и string"))
    expect(messages).toContainEqual(expect.stringContaining('свойство "Вариант" недоступно'))
    expect(messages).toContainEqual(expect.stringContaining('неизвестный корень "Неизвестный"'))
    expect(messages.filter((message) => message.includes("несовместимы"))).toHaveLength(1)
  })

  it("единым resolver проверяет известный и неизвестный путь DynamicList", () => {
    const source = [
      "Реквизиты:",
      "  Список:",
      "    ДинамическийСписок:",
      "      УсловноеОформление:",
      "        Элементы:",
      "          - Отбор:",
      "              Элементы:",
      "                - ЛевоеЗначение: .КомпоновщикНастроек.Настройки.НаличиеОтбора",
      "                  ПравоеЗначение: Истина",
      "                - ЛевоеЗначение: .НеизвестноеПоле",
      "                  ПравоеЗначение: Истина",
    ].join("\n") + "\n"
    const parsed = parseMetadataYaml(source)
    const yaml = parsed.data as Record<string, unknown>

    const messages = runValidation(parsed, yaml).map((item) => item.message)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain('Не удалось определить поле "Список.НеизвестноеПоле"')
  })

  it("не проверяет помеченные импортные аномалии", () => {
    const source = [
      "Реквизиты:",
      "  Число:",
      "    Тип: Число",
      "УсловноеОформлениеРеквизитов:",
      "  Элементы:",
      "    - Поля: [!xml/reference НеизвестныйЭлемент]",
      "      Отбор:",
      "        Элементы:",
      "          - ЛевоеЗначение: !xml/value НеизвестныйИсточник.Поле",
      "            ПравоеЗначение: .Число",
    ].join("\n") + "\n"
    const parsed = parseMetadataYaml(source)
    const yaml = parsed.data as Record<string, unknown>

    expect(runValidation(parsed, yaml)).toEqual([])
  })
})

function runValidation(
  parsed: ReturnType<typeof parseMetadataYaml>,
  yaml: Record<string, unknown>,
  elementNames: readonly string[] = [],
) {
  const dataPathContext: FormDataPathContext = {
    index: createFormDataPathIndexFromYAML(yaml),
    elementsByName: new Map(elementNames.map((name) => [name, {
      name,
      dataPathRule: { type: "DataPath" },
      yamlPath: ["Элементы", name],
      origin: "own" as const,
      present: false,
      value: undefined,
    }] as const)),
  }
  return withMetadataExecutionRegistrySets(registries, () => validateFormConditionalAppearance({
    filePath: "/tmp/Форма.yaml",
    parsed,
    context: mockContext,
    dataPathContext,
    ownerCache: emptyOwnerCache(),
  }))
}

function emptyOwnerCache(): OwnerMetadataCache {
  return {
    listRefs: () => [],
    get: () => ({ status: "not-found", diagnostics: [] }),
  }
}
