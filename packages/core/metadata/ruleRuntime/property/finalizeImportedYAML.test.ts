import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import type { MetadataItemRule } from "./types"
import type { PropertyRuleType } from "./registry"
import { registerTypeRule } from "./typeRuleRegistry"
import { finalizeImportedYamlValues, resolveDeferredPropertyRule } from "./finalizeImportedYAML"
import { bindDeferredObjectValues } from "./deferredObjectValues"

const pathType = "TestFinalizeImportedPath" as PropertyRuleType
const itemsType = "TestFinalizeImportedItems" as PropertyRuleType
const itemRule = {
  itemType: "TestFinalizeImportedItem",
  properties: {
    path: { type: pathType, yaml: "Путь" },
  },
} as const satisfies MetadataItemRule
const rootRule = {
  itemType: "TestFinalizeImportedRoot",
  properties: {
    items: { type: itemsType, yaml: "Элементы" },
  },
} as const satisfies MetadataItemRule

registerTypeRule(itemsType, "nestedItemRule", { itemRule })
registerTypeRule(pathType, "finalizeImportedYAML", ({ value }) => (value === "old" ? "new" : value))

describe("finalizeImportedYamlValues", () => {
  it.each([
    [["Объект", "Путь"], { Объект: { Путь: "old", Сосед: "keep" } }],
    [["Массив", 0, "Путь"], { Массив: [{ Путь: "old", Сосед: "keep" }] }],
    [["Запись", "Ключ", "Путь"], { Запись: { Ключ: { Путь: "old", Сосед: "keep" } } }],
  ] as const)("заменяет только значение по пути %j", (yamlPath, yaml) => {
    finalizeImportedYamlValues({
      yaml,
      rootRule,
      deferred: bindDeferredObjectValues(yaml, [
        {
          valuePath: yamlPath,
          rulePath: [
            { propertyKey: "items", nestedItemType: itemRule.itemType },
            { propertyKey: "path" },
          ],
        },
      ]),
      context: mockContext,
    })

    const owner = readPath(yaml, yamlPath.slice(0, -1)) as Record<string, unknown>
    expect(owner.Путь).toBe("new")
    expect(owner.Сосед).toBe("keep")
  })

  it("сообщает yamlPath и rulePath для отсутствующего значения", () => {
    expect(() =>
      bindDeferredObjectValues({}, [
        {
          valuePath: ["Нет", "Пути"],
          rulePath: [
            { propertyKey: "items", nestedItemType: itemRule.itemType },
            { propertyKey: "path" },
          ],
        },
      ])
    ).toThrow(/valuePath=\/Нет\/Пути.*rulePath=\/items:TestFinalizeImportedItem\/path/)
  })

  it("сообщает неверный rulePath", () => {
    expect(() => resolveDeferredPropertyRule(rootRule, [{ propertyKey: "missing" }])).toThrow(
      "Не найден rulePath /missing"
    )
  })
})

function readPath(value: unknown, path: readonly (string | number)[]): unknown {
  return path.reduce<unknown>((current, segment) => (current as Record<string | number, unknown>)[segment], value)
}
