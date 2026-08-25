import { describe,expect,it } from "vitest"
import "../../forms"
import { ClientApplicationFormRules } from "../../forms/clientApplicationForm/rules"
import type { ClientApplicationForm } from "../../forms/clientApplicationForm/types"
import type { ChildItem } from "../../forms/commonObjects/childItems/types"
import { collectFormDataPathOccurrences } from "./formTraversal"
import { collectFormDataPathOccurrencesFromYAML } from "./formYamlTraversal"

describe("collectFormDataPathOccurrences", () => {
  it("collects present string DataPath values from form elements and nested table children", () => {
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      childItems: [
        inputField("Поле", "Реквизит"),
        {
          itemType: "Table",
          name: "Таблица",
          dataPath: "Товары",
          childItems: [
            tableInputField("Количество", "Товары.Количество"),
            {
              itemType: "ColumnGroup",
              name: "ГруппаКолонок",
              headerDataPath: "Товары.Группа",
              childItems: [tableLabelField("Представление", "Товары.Представление")],
            },
          ],
        },
      ],
    } as ClientApplicationForm

    const occurrences = collectFormDataPathOccurrences(form)

    expect(
      occurrences.map((occurrence) => ({
        value: occurrence.value,
        yamlPath: occurrence.yamlPath,
        elementType: occurrence.elementType,
        tableContext: occurrence.tableContext,
        yaml: occurrence.rule.yaml,
      }))
    ).toEqual([
      {
        value: "Реквизит",
        yamlPath: ["Элементы", "Поле", "ПутьКДанным"],
        elementType: "InputField",
        tableContext: undefined,
        yaml: "ПутьКДанным",
      },
      {
        value: "Товары",
        yamlPath: ["Элементы", "Таблица", "ПутьКДанным"],
        elementType: "Table",
        tableContext: undefined,
        yaml: "ПутьКДанным",
      },
      {
        value: "Товары.Количество",
        yamlPath: ["Элементы", "Таблица", "Элементы", "Количество", "ПутьКДанным"],
        elementType: "TableInputField",
        tableContext: { dataPath: "Товары" },
        yaml: "ПутьКДанным",
      },
      {
        value: "Товары.Группа",
        yamlPath: ["Элементы", "Таблица", "Элементы", "ГруппаКолонок", "ПутьКДаннымШапки"],
        elementType: "ColumnGroup",
        tableContext: undefined,
        yaml: "ПутьКДаннымШапки",
      },
      {
        value: "Товары.Представление",
        yamlPath: ["Элементы", "Таблица", "Элементы", "ГруппаКолонок", "Элементы", "Представление", "ПутьКДанным"],
        elementType: "TableLabelField",
        tableContext: { dataPath: "Товары" },
        yaml: "ПутьКДанным",
      },
    ])
  })

  it("skips missing and empty DataPath values", () => {
    const form = {
      itemType: "ClientApplicationForm",
      childItems: [inputField("Пустое", ""), { itemType: "LabelField", name: "БезПути" }],
    } as ClientApplicationForm

    expect(collectFormDataPathOccurrences(form)).toEqual([])
  })

  it("collects DataPath values from singleton element properties", () => {
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      commands: [],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: false,
        childItems: [commandBarButton("КомандаФормы", "Реквизит")],
      },
      childItems: [
        {
          ...inputField("Поле", "Реквизит"),
          contextMenu: {
            itemType: "ContextMenu",
            childItems: [commandBarButton("КомандаМеню", "Реквизит")],
          },
        },
      ],
    } as ClientApplicationForm

    expect(
      collectFormDataPathOccurrences(form).map((occurrence) => ({
        value: occurrence.value,
        yamlPath: occurrence.yamlPath,
        elementType: occurrence.elementType,
      }))
    ).toContainEqual({
      value: "Реквизит",
      yamlPath: ["КоманднаяПанель", "Элементы", "КомандаФормы", "Данные"],
      elementType: "CommandBarButton",
    })
    expect(
      collectFormDataPathOccurrences(form).map((occurrence) => ({
        value: occurrence.value,
        yamlPath: occurrence.yamlPath,
        elementType: occurrence.elementType,
      }))
    ).toContainEqual({
      value: "Реквизит",
      yamlPath: ["Элементы", "Поле", "КонтекстноеМеню", "Элементы", "КомандаМеню", "Данные"],
      elementType: "CommandBarButton",
    })
  })
})

describe("collectFormDataPathOccurrencesFromYAML", () => {

  it("посещает вложенные элементы и остаётся совместимым с вызовом без visitor", () => {
    const yaml = {
      Элементы: {
        Таблица: {
          Вид: "ТаблицаФормы",
          ПутьКДанным: "Товары",
          Элементы: {
            Количество: {
              Вид: "ПолеВвода",
              ПутьКДанным: "Товары.Количество",
            },
          },
        },
      },
    }
    const visited: Array<{ itemType: string; yamlPath: readonly (string | number)[] }> = []

    const withVisitor = collectFormDataPathOccurrencesFromYAML({
      yaml,
      rule: ClientApplicationFormRules,
      visitItem: ({ rule, yamlPath }) => visited.push({ itemType: rule.itemType, yamlPath }),
    })
    const withoutVisitor = collectFormDataPathOccurrencesFromYAML({ yaml, rule: ClientApplicationFormRules })

    expect(visited).toEqual([
      { itemType: "ClientApplicationForm", yamlPath: [] },
      { itemType: "Table", yamlPath: ["Элементы", "Таблица"] },
      { itemType: "TableInputField", yamlPath: ["Элементы", "Таблица", "Элементы", "Количество"] },
    ])
    expect(withoutVisitor.map(({ value, yamlPath }) => ({ value, yamlPath }))).toEqual(
      withVisitor.map(({ value, yamlPath }) => ({ value, yamlPath }))
    )
  })
})

function inputField(name: string, dataPath: string): ChildItem {
  return { itemType: "InputField", name, dataPath } as ChildItem
}

function tableInputField(name: string, dataPath: string): ChildItem {
  return { itemType: "TableInputField", name, dataPath } as ChildItem
}

function tableLabelField(name: string, dataPath: string): ChildItem {
  return { itemType: "TableLabelField", name, dataPath } as ChildItem
}

function commandBarButton(name: string, dataPath: string): ChildItem {
  return { itemType: "CommandBarButton", name, dataPath } as ChildItem
}
