import { describe, expect, it } from "vitest"
import type { CollectableElement, TypedFormElement } from "~/metadata/orchestration"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { exportChildItemToTreeNodeYAML } from "../../commonObjects/childItems/treeYAML"
import { groupedFixtures, groupedTypedFixtures } from "./fixtures"

describe("exportElementToPartialYAML", () => {
  describe.each(Object.entries(groupedFixtures))("%s", (_group, fixtures) => {
    it.each(fixtures)("$name", (fixture) => {
      const result = exportElementToPartialYAML({
        context: mockContext,
        element: fixture.model as CollectableElement,
      })

      expect(result).toEqual(fixture.yaml)
    })
  })
})

describe("exportElementToTypedYAML", () => {
  describe.each(Object.entries(groupedTypedFixtures))("%s", (group, fixtures) => {
    it.each(fixtures)(`${group} -  $name`, (fixture) => {
      const result = exportElementToTypedYAML({
        context: mockContext,
        element: fixture.model as TypedFormElement,
      })

      expect(result).toEqual(fixture.typedYAML)
    })
  })
})

describe("exportChildItemToTreeNodeYAML", () => {
  it("exports group kind, group mode and nested child items", () => {
    const result = exportChildItemToTreeNodeYAML({
      context: mockContext,
      item: {
        itemType: "UsualGroup",
        name: "Группа",
        group: "Vertical",
        childItems: [
          {
            itemType: "InputField",
            name: "Реквизит",
            dataPath: "Объект.Реквизит",
          },
        ],
      },
    })

    expect(result).toEqual({
      Вид: "Группа",
      Группировка: "Вертикальная",
      Элементы: {
        Реквизит: {
          Вид: "ПолеВвода",
          ПутьКДанным: "Объект.Реквизит",
        },
      },
    })
  })

  it("exports explicit table data path", () => {
    const result = exportChildItemToTreeNodeYAML({
      context: mockContext,
      item: {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Объект.Таблица",
        childItems: [],
      },
    })

    expect(result).toEqual({
      Вид: "ТаблицаФормы",
      ПутьКДанным: "Объект.Таблица",
    })
  })
})
