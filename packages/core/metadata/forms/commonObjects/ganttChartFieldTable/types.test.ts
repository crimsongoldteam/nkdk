import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../../tests/directConversion"
import { GanttChartFieldRules } from "../../elements/ganttChartField/rules"

import "../../elements/index"

describe("таблица поля диаграммы Ганта", () => {
  it("восстанавливает собственные id и вложенные элементы без reference XML", () => {
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
      },
    }

    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule: GanttChartFieldRules,
      xml: source,
      name: "ПоУмолчанию",
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule: GanttChartFieldRules,
      yaml: imported.yaml,
      name: "ПоУмолчанию",
    })

    expect(exported.xml.Table).toMatchObject(source.Table)
  })
})
