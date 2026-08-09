import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "../../../configurationIndex/collector/writer"
import {
  withConfigurationIndexCollector,
  withConfigurationIndexFormElementRootLogicalAddress,
} from "../../../configurationIndex/collector/context"
import { createLocalIndexesCollector } from "../../../project/localIndexes"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { exportToYAML } from "../../../../yaml/export"
import "../../elements"
import { importChildItemsFromXMLToYAML } from "./fromXMLToYAML"

describe("importChildItemsFromXMLToYAML", () => {
  it("строит YAML и плоские адреса обычного и single-элементов", () => {
    const configurationIndex = createConfigurationIndexCollector()
    const context = withConfigurationIndexFormElementRootLogicalAddress(
      withConfigurationIndexCollector(mockContextFromXML(), configurationIndex, "Форма"),
      "Форма"
    )
    const localIndexes = createLocalIndexesCollector()

    const yaml = importChildItemsFromXMLToYAML({
      context,
      rule: { type: "GroupChildItems", yaml: "Элементы" },
      xml: [
        {
          InputField: {
            _name: "Поле",
            _id: "1",
            DataPath: "Объект.Наименование",
            ContextMenu: { _name: "ПолеКонтекстноеМеню", _id: "2" },
            ExtendedTooltip: { _name: "ПолеРасширеннаяПодсказка", _id: "3" },
          },
        },
      ],
      traversal: {
        yamlPath: ["Элементы"],
        rulePath: [{ propertyKey: "childItems" }],
        collector: localIndexes,
      },
    })

    expect(yaml).toEqual({
      Поле: {
        Вид: "ПолеВвода",
        ПутьКДанным: "Объект.Наименование",
      },
    })
    expect(localIndexes.finish().metadata.events).toContainEqual(
      expect.objectContaining({
        propertyType: "DataPath",
        yamlPath: ["Элементы", "Поле", "ПутьКДанным"],
        rulePath: [
          { propertyKey: "childItems", nestedItemType: "InputField" },
          { propertyKey: "dataPath" },
        ],
      })
    )
    expect(configurationIndex.fragment("Форма.yaml").entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          logicalAddress: "Форма.Элемент.Поле",
          identities: expect.objectContaining({ xmlId: "1" }),
        }),
        expect.objectContaining({
          logicalAddress: "Форма.Элемент.Поле.КонтекстноеМеню",
          identities: expect.objectContaining({ xmlId: "2" }),
        }),
        expect.objectContaining({
          logicalAddress: "Форма.Элемент.Поле.РасширеннаяПодсказка",
          identities: expect.objectContaining({ xmlId: "3" }),
        }),
      ])
    )
  })

  it("не смешивает вид кнопки с видом элемента", () => {
    const yaml = importChildItemsFromXMLToYAML({
      context: mockContextFromXML(),
      rule: { type: "GroupChildItems", yaml: "Элементы" },
      xml: {
        Button: {
          _name: "Изменить",
          Type: "Hyperlink",
        },
      },
      traversal: {
        yamlPath: ["Элементы"],
        rulePath: [{ propertyKey: "childItems" }],
        collector: createLocalIndexesCollector(),
      },
    })

    expect(yaml).toEqual({
      Изменить: {
        Вид: "Кнопка",
        ТипКнопки: "Гиперссылка",
      },
    })
  })

  it("записывает обязательный тип обычной кнопки отдельно от вида элемента", () => {
    const yaml = importChildItemsFromXMLToYAML({
      context: mockContextFromXML(),
      rule: { type: "GroupChildItems", yaml: "Элементы" },
      xml: { Button: { _name: "ОК", Type: "UsualButton" } },
      traversal: {
        yamlPath: ["Элементы"],
        rulePath: [{ propertyKey: "childItems" }],
        collector: createLocalIndexesCollector(),
      },
    })

    expect(yaml).toEqual({ ОК: { Вид: "Кнопка", ТипКнопки: "ОбычнаяКнопка" } })
  })

  it("сохраняет !xml у явного Auto в колонке таблицы", () => {
    const yaml = importChildItemsFromXMLToYAML({
      context: mockContextFromXML(),
      rule: { type: "TableChildItems", yaml: "Элементы" },
      xml: {
        InputField: {
          _name: "Колонка",
          DataPath: "Таблица.Поле",
          HeaderHorizontalAlign: "Auto",
        },
      },
      traversal: {
        yamlPath: ["Элементы"],
        rulePath: [{ propertyKey: "childItems" }],
        collector: createLocalIndexesCollector(),
      },
    })

    expect(exportToYAML(yaml)).toContain("ГоризонтальноеПоложениеВШапке: !xml")
    expect(exportToYAML(yaml)).not.toContain("!xml Авто")
  })
})
