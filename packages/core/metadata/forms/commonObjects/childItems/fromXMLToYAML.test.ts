import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "../../../configurationIndex/collector/writer"
import {
  withConfigurationIndexCollector,
  withConfigurationIndexFormElementRootLogicalAddress,
} from "../../../configurationIndex/collector/context"
import { createLocalIndexesCollector } from "../../../project/localIndexes"
import { mockContextFromXML } from "../../../../tests/mockContext"
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
    expect(configurationIndex.fragment("Форма.yaml").identities).toEqual(
      expect.arrayContaining([
        { logicalAddress: "Форма.Элемент.Поле", kind: "xmlId", value: "1" },
        { logicalAddress: "Форма.Элемент.Поле.КонтекстноеМеню", kind: "xmlId", value: "2" },
        { logicalAddress: "Форма.Элемент.Поле.РасширеннаяПодсказка", kind: "xmlId", value: "3" },
      ])
    )
  })
})
