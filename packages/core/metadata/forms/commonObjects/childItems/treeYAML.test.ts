import { describe, expect, it } from "vitest"
import { mockContext, mockContextToYAML } from "~/tests/mockContext"
import {
  exportChildItemsToTreeYAML,
  importChildItemsFromTreeYAML,
  importChildItemsFromTreeYAMLProperty,
} from "./treeYAML"
import type { FormElementsYAML, GroupChildItems } from "./types"

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

  it("exports button type as ТипКнопки without losing Вид discriminator", () => {
    const items: GroupChildItems = [
      {
        itemType: "Button",
        name: "Открыть",
        type: "Hyperlink",
        commandName: "Открыть",
      },
    ]

    expect(exportChildItemsToTreeYAML({ context: mockContextToYAML, items })).toEqual({
      Открыть: {
        Вид: "Кнопка",
        ТипКнопки: "Гиперссылка",
        ИмяКоманды: "Открыть",
      },
    })
  })

  it("imports button type from ТипКнопки without losing Вид discriminator", () => {
    const result = importChildItemsFromTreeYAML<GroupChildItems>({
      context: mockContext,
      yaml: {
        Открыть: {
          Вид: "Кнопка",
          ТипКнопки: "Гиперссылка",
          ИмяКоманды: "Открыть",
        },
      },
    })

    expect(result).toEqual([
      {
        itemType: "Button",
        name: "Открыть",
        type: "Hyperlink",
        commandName: "Открыть",
      },
    ])
  })

  it("imports command bar button type from ТипКнопки without using Тип discriminator", () => {
    const result = importChildItemsFromTreeYAML({
      context: mockContext,
      propertyType: "CommandBarChildItems",
      yaml: {
        Команда: {
          Вид: "КнопкаКоманднойПанели",
          ТипКнопки: "КнопкаКоманднойПанели",
          ИмяКоманды: "Команда",
        },
      },
    })

    expect(result).toEqual([
      {
        itemType: "CommandBarButton",
        name: "Команда",
        type: "CommandBarButton",
        commandName: "Команда",
      },
    ])
  })

  it("does not accept Тип as a tree discriminator", () => {
    expect(() =>
      importChildItemsFromTreeYAML({
        context: mockContext,
        yaml: {
          Товар: {
            Тип: "ПолеВвода",
            ПутьКДанным: "Объект.Товар",
          },
        },
      })
    ).toThrow('Элемент "Товар": обязательное поле "Вид" не задано')
  })

  it("imports transitional partial YAML from source when tree YAML is absent", () => {
    const allElements = {
      Товар: {
        ПутьКДанным: "Объект.Товар",
      },
    } as FormElementsYAML

    const result = importChildItemsFromTreeYAMLProperty({
      context: {
        ...mockContext,
        allElements,
      },
      rule: { type: "GroupChildItems", defaultValue: [] },
      value: undefined,
      source: [
        {
          itemType: "InputField",
          name: "Товар",
        },
      ],
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
