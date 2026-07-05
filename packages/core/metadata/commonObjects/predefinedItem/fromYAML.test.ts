import Schema from "typebox/schema"
import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../orchestration"
import { testExportPropertyToYAML } from "../../../tests/property/exportPropertyToYAML"
import { testImportPropertyFromYAML } from "../../../tests/property/importPropertyFromYAML"
import { mockContext } from "../../../tests/mockContext"
import { exportPredefinedItemCollectionToJSONSchema } from "./toJSONSchema"
import { group, groupYAML } from "./__fixtures__/group"
import { item, itemYAML } from "./__fixtures__/item"
import "./types"

const importRule: PropertyRule = { type: "PredefinedItemCollection" }
const exportRule: PropertyRule = { type: "PredefinedItemCollection", yaml: "Элементы" }

const cases = [
  { name: "group", model: [group], yaml: groupYAML },
  { name: "item", model: [item], yaml: itemYAML },
] as const

describe("import PredefinedItemCollection from YAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule: importRule, value: undefined })
    expect(result).toBeUndefined()
  })

  it.each(cases)("imports $name fixture", ({ model, yaml }) => {
    const result = testImportPropertyFromYAML({ rule: importRule, value: yaml })
    expect(result).toEqual(model)
  })

  it("imports ТипЗначения from YAML", () => {
    const result = testImportPropertyFromYAML({
      rule: importRule,
      value: {
        ПредопределенноеВсеСвойства: {
          Код: "000000001",
          Наименование: "Предопределенное все свойства",
          ТипЗначения: "Строка(10)",
        },
      },
    })

    expect(result).toMatchObject([
      {
        itemType: "PredefinedItem",
        name: "ПредопределенноеВсеСвойства",
        type: {
          type: ["string"],
          stringQualifiers: {
            length: 10,
            allowedLength: "Variable",
          },
        },
      },
    ])
  })

  it.each(cases)("round-trip $name: import → export совпадает с исходным YAML", ({ yaml }) => {
    const imported = testImportPropertyFromYAML({ rule: importRule, value: yaml })
    const exported = testExportPropertyToYAML({ rule: exportRule, value: imported })
    expect(exported).toEqual({ Элементы: yaml })
  })
})

describe("PredefinedItemCollection JSON Schema", () => {
  const check = Schema.Compile(exportPredefinedItemCollectionToJSONSchema(mockContext))

  it("принимает keyed-запись без Кода и Наименования", () => {
    expect(check.Check({ ПредопределенноеЗначение: {} })).toBe(true)
  })

  it("принимает keyed-запись только с Наименованием", () => {
    expect(check.Check({ ПредопределенноеЗначение: { Наименование: "Тест" } })).toBe(true)
  })

  it("проверяет тип явного Кода", () => {
    expect(check.Check({ ПредопределенноеЗначение: { Код: {} } })).toBe(false)
  })

  it("отклоняет неизвестные свойства", () => {
    expect(check.Check({ ПредопределенноеЗначение: { Лишнее: "значение" } })).toBe(false)
  })
})
