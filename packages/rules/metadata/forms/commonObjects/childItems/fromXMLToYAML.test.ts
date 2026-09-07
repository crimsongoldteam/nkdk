import {
createConfigurationIndexCollector,withConfigurationIndexCollector,
withConfigurationIndexFormElementRootLogicalAddress, parseXmlDocumentWithSaxes
} from "@nkdk/runtime"
import { describe,expect,it,vi } from "vitest"
import * as elementRules from "../../../ruleRuntime/formElement/ruleFactory"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { createLocalIndexesCollector } from "../../../projectDefinition/localIndexes"
import "../../elements"
import { importChildItemsFromXMLToYAML } from "./fromXMLToYAML"
import { createDirectImportFactsCollector } from "@nkdk/runtime/rule-kit"

describe("importChildItemsFromXMLToYAML", () => {
  it("не собирает значения дочерних YAML-объектов повторно в режиме фактов", () => {
    const facts = createDirectImportFactsCollector()
    const xml = parseXmlDocumentWithSaxes('<ChildItems><Button name="ОК"><Type>UsualButton</Type><Width>20</Width></Button></ChildItems>').roots[0]!
    const result = importChildItemsFromXMLToYAML({
      context: mockContextFromXML(),
      rule: { type: "GroupChildItems", yaml: "Элементы" },
      xml,
      traversal: {
        mode: "facts", produceResult: true, facts,
        yamlPath: ["Элементы"], rulePath: [{ propertyKey: "childItems" }],
        collector: createLocalIndexesCollector(),
      },
    })

    expect(result).toEqual({ ОК: { Вид: "Кнопка" } })
    expect(facts.finish()).toEqual(expect.arrayContaining([
      expect.objectContaining({ yamlPath: ["Элементы", "ОК", "Ширина"], value: 20 }),
      expect.objectContaining({ yamlPath: ["Элементы", "ОК", "ТипКнопки"], value: "ОбычнаяКнопка" }),
    ]))
  })

  it("проверяет уже окончательные Вид и ТипКнопки, не заменяя возвращённый item", () => {
    let closed: Record<string, unknown> | undefined
    const yaml = importChildItemsFromXMLToYAML({
      context: mockContextFromXML(),
      rule: { type: "GroupChildItems", yaml: "Элементы" },
      xml: parseXmlDocumentWithSaxes('<ChildItems><Button name="Изменить"><Type>Hyperlink</Type><Width>20</Width></Button></ChildItems>').roots[0],
      traversal: {
        yamlPath: ["Элементы"], rulePath: [{ propertyKey: "childItems" }], collector: createLocalIndexesCollector(),
        roundTrip: { open({ yaml }) { return {
          ready({ propertyKey }) {
            if (propertyKey === "type") expect(yaml).toMatchObject({ Вид: "Кнопка", ТипКнопки: "Гиперссылка" })
          },
          finish() {
            closed = yaml
            expect(Object.keys(yaml)).toEqual(["Вид", "Ширина", "ТипКнопки"])
            Object.freeze(yaml)
          },
        } } },
      },
    })
    expect(yaml).toEqual({ Изменить: { Вид: "Кнопка", Ширина: 20, ТипКнопки: "Гиперссылка" } })
    expect((yaml as Record<string, unknown>).Изменить).toBe(closed)
  })

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
      xml: parseXmlDocumentWithSaxes('<ChildItems><InputField name="Поле" id="1"><DataPath>Объект.Наименование</DataPath><ContextMenu name="ПолеКонтекстноеМеню" id="2"/><ExtendedTooltip name="ПолеРасширеннаяПодсказка" id="3"/></InputField></ChildItems>').roots[0],
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
          xmlId: "1",
        }),
        expect.objectContaining({
          logicalAddress: "Форма.Элемент.Поле.КонтекстноеМеню",
          xmlId: "2",
        }),
        expect.objectContaining({
          logicalAddress: "Форма.Элемент.Поле.РасширеннаяПодсказка",
          xmlId: "3",
        }),
      ])
    )
  })

  it("не смешивает вид кнопки с видом элемента", () => {
    const lookup = vi.spyOn(elementRules, "getElementRule")
    try {
      const yaml = importChildItemsFromXMLToYAML({
        context: mockContextFromXML(),
        rule: { type: "GroupChildItems", yaml: "Элементы" },
        xml: parseXmlDocumentWithSaxes('<ChildItems><Button name="Изменить"><Type>Hyperlink</Type></Button><Button name="ОК"><Type>UsualButton</Type></Button></ChildItems>').roots[0],
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
        ОК: { Вид: "Кнопка", ТипКнопки: "ОбычнаяКнопка" },
      })
      expect(lookup.mock.calls.filter(([itemType]) => itemType === "Button")).toHaveLength(1)
    } finally {
      lookup.mockRestore()
    }
  })

  it("записывает обязательный тип обычной кнопки отдельно от вида элемента", () => {
    const yaml = importChildItemsFromXMLToYAML({
      context: mockContextFromXML(),
      rule: { type: "GroupChildItems", yaml: "Элементы" },
      xml: parseXmlDocumentWithSaxes('<ChildItems><Button name="ОК"><Type>UsualButton</Type></Button></ChildItems>').roots[0],
      traversal: {
        yamlPath: ["Элементы"],
        rulePath: [{ propertyKey: "childItems" }],
        collector: createLocalIndexesCollector(),
      },
    })

    expect(yaml).toEqual({ ОК: { Вид: "Кнопка", ТипКнопки: "ОбычнаяКнопка" } })
  })
})
