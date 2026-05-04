/**
 * Unit-тесты для buildGraphFromModel CommandName.
 * PRD #121: свойство commandName на кнопках формы → reference-ребро ИмяКоманды.
 */

import { describe, expect, it } from "vitest"
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { ClientApplicationFormRules } from "../../clientApplicationForm/rules"

// Регистрирует все обработчики элементов формы (включая CommandName через graphFromModel)
import "../../elements"
// Регистрирует graphChild для FormCommands
import "../formCommand/graphFromModel"

const FORM_NODE_ID = "Справочник.Товары.Форма.ФормаСписка"
const FILE_PATH = "Справочник/Товары/Формы/ФормаСписка/Свойства.yaml"

/**
 * Создаёт граф с узлом формы и узлом команды «ОткрытьВнешний».
 */
function makeGraphWithCommand() {
  const graph = new GraphBuilder()
  graph.ensureNode(FORM_NODE_ID, { name: "ФормаСписка" })

  const cmdNodeId = `${FORM_NODE_ID}.Команда.ОткрытьВнешний`
  graph.ensureNode(cmdNodeId, { name: "ОткрытьВнешний" })
  graph.addFilePath(cmdNodeId, FILE_PATH)
  graph.ensureEdge(FORM_NODE_ID, cmdNodeId, "FORM_COMMAND", { yaml: "КомандаФормы" })

  return graph
}

describe("CommandName buildGraphFromModel — ИмяКоманды", () => {
  it("создаёт reference-ребро ИмяКоманды к существующей команде", () => {
    const graph = makeGraphWithCommand()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "КнопкаОткрыть",
            itemType: "Button",
            commandName: "ОткрытьВнешний",
          },
        ],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const buttonNodeId = `${FORM_NODE_ID}.Элемент.КнопкаОткрыть`
    expect(graph.hasNode(buttonNodeId)).toBe(true)

    const commandEdges = [...graph.outEdgeEntries(buttonNodeId)].filter(
      (e) => e.attributes.kind === "COMMAND_NAME",
    )
    expect(commandEdges).toHaveLength(1)
    expect(commandEdges[0].target).toBe(`${FORM_NODE_ID}.Команда.ОткрытьВнешний`)
  })

  it("создаёт заглушку и reference-ребро, если команда отсутствует в форме", () => {
    const graph = new GraphBuilder()
    graph.ensureNode(FORM_NODE_ID, { name: "ФормаСписка" })

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "КнопкаОткрыть",
            itemType: "Button",
            commandName: "НесуществующаяКоманда",
          },
        ],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const buttonNodeId = `${FORM_NODE_ID}.Элемент.КнопкаОткрыть`
    const commandEdges = [...graph.outEdgeEntries(buttonNodeId)].filter(
      (e) => e.attributes.kind === "COMMAND_NAME",
    )
    // Ребро создано (к заглушке)
    expect(commandEdges).toHaveLength(1)
    const stubId = commandEdges[0].target
    expect(stubId).toBe(`${FORM_NODE_ID}.Команда.НесуществующаяКоманда`)
    // В GraphBuilder stub-узел имеет пустой массив filePaths (не undefined)
    expect(graph.getNodeAttributes(stubId).filePaths).toEqual([])
  })

  it("пустое commandName → ребро не создаётся", () => {
    const graph = makeGraphWithCommand()

    buildGraphFromModel({
      model: {
        childItems: [
          {
            name: "КнопкаОткрыть",
            itemType: "Button",
            commandName: "",
          },
        ],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    const buttonNodeId = `${FORM_NODE_ID}.Элемент.КнопкаОткрыть`
    const commandEdges = [...graph.outEdgeEntries(buttonNodeId)].filter(
      (e) => e.attributes.kind === "COMMAND_NAME",
    )
    expect(commandEdges).toHaveLength(0)
  })
})
