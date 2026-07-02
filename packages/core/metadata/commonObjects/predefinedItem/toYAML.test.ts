import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../orchestration"
import { testExportPropertyToYAML } from "../../../tests/property/exportPropertyToYAML"
import { group, groupYAML } from "./__fixtures__/group"
import { item, itemYAML } from "./__fixtures__/item"
import "./types"

const rule: PropertyRule = { type: "PredefinedItemCollection", yaml: "Элементы" }

const cases = [
  { name: "group", model: [group], yaml: groupYAML },
  { name: "item", model: [item], yaml: itemYAML },
] as const

describe("export PredefinedItemCollection to YAML", () => {
  it("exports undefined", () => {
    const result = testExportPropertyToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it.each(cases)("exports $name fixture", ({ model, yaml }) => {
    const result = testExportPropertyToYAML({ rule, value: model })
    expect(result).toEqual({ Элементы: yaml })
  })

  it("exports ТипЗначения for non-folder items and hides it for folders", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: [
        {
          itemType: "PredefinedItem",
          name: "ПредопределенноеВсеСвойства",
          isFolder: false,
          code: "000000001",
          description: "Предопределенное все свойства",
          type: {
            type: ["string"],
            stringQualifiers: {
              length: 10,
              allowedLength: "Variable",
            },
          },
        },
        {
          itemType: "PredefinedItem",
          name: "Группа",
          isFolder: true,
          code: "000000002",
          description: "Группа",
          type: {
            type: [],
          },
        },
      ],
    })

    expect(result).toMatchObject({
      Элементы: {
        ПредопределенноеВсеСвойства: {
          ТипЗначения: "Строка(10)",
        },
        Группа: {},
      },
    })
    expect((result as { Элементы: { Группа: Record<string, unknown> } }).Элементы.Группа).not.toHaveProperty(
      "ТипЗначения"
    )
  })
})
