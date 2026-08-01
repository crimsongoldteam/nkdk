import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../../tests/directConversion"
import { GanttChartFieldRules } from "../../elements/ganttChartField/rules"

import "../../elements/index"

describe("таблица поля диаграммы Ганта", () => {
  it("восстанавливает канонические дополнения без явных YAML-ключей", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "ОбщаяФорма.GanttChartField.Элемент.ПоУмолчанию",
      targetProjectPath: "ОбщаяФорма/GanttChartField/Свойства.yaml",
    })
    const source = {
      Table: {
        _name: "ПоУмолчаниюТаблица",
        _id: "9",
        Representation: "Tree",
        ContextMenu: {
          _name: "ПоУмолчаниюТаблицаКонтекстноеМеню",
          _id: "10",
        },
        ExtendedTooltip: {
          _name: "ПоУмолчаниюТаблицаРасширеннаяПодсказка",
          _id: "12",
        },
        SearchStringAddition: {
          _name: "ПоУмолчаниюТаблицаСтрокаПоиска",
          _id: "13",
          AdditionSource: {
            Item: "ПоУмолчаниюТаблица",
            Type: "SearchStringRepresentation",
          },
          ContextMenu: {
            _name: "ПоУмолчаниюТаблицаСтрокаПоискаКонтекстноеМеню",
            _id: "14",
          },
          ExtendedTooltip: {
            _name: "ПоУмолчаниюТаблицаСтрокаПоискаРасширеннаяПодсказка",
            _id: "15",
          },
        },
        ViewStatusAddition: {
          _name: "ПоУмолчаниюТаблицаСостояниеПросмотра",
          _id: "16",
          AdditionSource: {
            Item: "ПоУмолчаниюТаблица",
            Type: "ViewStatusRepresentation",
          },
          ContextMenu: {
            _name: "ПоУмолчаниюТаблицаСостояниеПросмотраКонтекстноеМеню",
            _id: "17",
          },
          ExtendedTooltip: {
            _name: "ПоУмолчаниюТаблицаСостояниеПросмотраРасширеннаяПодсказка",
            _id: "18",
          },
        },
        SearchControlAddition: {
          _name: "ПоУмолчаниюТаблицаУправлениеПоиском",
          _id: "19",
          AdditionSource: {
            Item: "ПоУмолчаниюТаблица",
            Type: "SearchControl",
          },
          ContextMenu: {
            _name: "ПоУмолчаниюТаблицаУправлениеПоискомКонтекстноеМеню",
            _id: "20",
          },
          ExtendedTooltip: {
            _name: "ПоУмолчаниюТаблицаУправлениеПоискомРасширеннаяПодсказка",
            _id: "21",
          },
        },
      },
    }

    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule: GanttChartFieldRules,
      xml: source,
      name: "ПоУмолчанию",
    })
    const importedYAML = imported.yaml as { Таблица: Record<string, unknown> }
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule: GanttChartFieldRules,
      yaml: importedYAML,
      name: "ПоУмолчанию",
    })

    expect(importedYAML.Таблица).not.toHaveProperty("ОтображениеСтрокиПоиска")
    expect(importedYAML.Таблица).not.toHaveProperty("ОтображениеСостоянияПросмотра")
    expect(importedYAML.Таблица).not.toHaveProperty("УправлениеПоиском")
    expect(exported.xml.Table).toMatchObject({
      SearchStringAddition: source.Table.SearchStringAddition,
      ViewStatusAddition: source.Table.ViewStatusAddition,
      SearchControlAddition: source.Table.SearchControlAddition,
    })
  })
})
