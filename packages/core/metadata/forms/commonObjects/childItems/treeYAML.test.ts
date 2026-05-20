import { describe, expect, it } from "vitest"
import { mockContext, mockContextToYAML } from "~/tests/mockContext"
import { exportChildItemsToTreeYAML, importChildItemsFromTreeYAML } from "./treeYAML"
import type { GroupChildItems } from "./types"

describe("child item tree YAML", () => {
  it("exports a simple input field node with Вид", () => {
    const items: GroupChildItems = [
      {
        itemType: "InputField",
        name: "Товар",
        dataPath: "Объект.Товар",
      },
    ]

    expect(exportChildItemsToTreeYAML({ context: mockContextToYAML, items })).toEqual({
      Товар: {
        Вид: "ПолеВвода",
        ПутьКДанным: "Объект.Товар",
      },
    })
  })

  it("imports a simple input field node without a source tree", () => {
    const result = importChildItemsFromTreeYAML<GroupChildItems>({
      context: mockContext,
      yaml: {
        Товар: {
          Вид: "ПолеВвода",
          ПутьКДанным: "Объект.Товар",
        },
      },
    })

    expect(result).toEqual([
      {
        itemType: "InputField",
        name: "Товар",
        dataPath: "Объект.Товар",
      },
    ])
  })

  it("throws a clear error when Вид is missing", () => {
    expect(() =>
      importChildItemsFromTreeYAML({
        context: mockContext,
        yaml: {
          Товар: {
            ПутьКДанным: "Объект.Товар",
          },
        },
      })
    ).toThrow('Элемент "Товар": обязательное поле "Вид" не задано')
  })

  it("throws a clear error when Вид is unknown", () => {
    expect(() =>
      importChildItemsFromTreeYAML({
        context: mockContext,
        yaml: {
          Товар: {
            Вид: "НесуществующийЭлемент",
          },
        },
      })
    ).toThrow('Элемент "Товар": неизвестный Вид "НесуществующийЭлемент"')
  })
})
