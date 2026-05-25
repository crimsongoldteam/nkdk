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
import { buildCommandNameGraphOps } from "./graphFromModel"

const FORM_NODE_ID = "Catalog.Товары.Form.ФормаСписка"
const FILE_PATH = "Справочник/Товары/Формы/ФормаСписка/Свойства.yaml"

/**
 * Создаёт граф с узлом формы и узлом команды «ОткрытьВнешний».
 */
function makeGraphWithCommand() {
  const graph = new GraphBuilder()
  graph.ensureNode(FORM_NODE_ID, { name: "ФормаСписка" })

  const cmdNodeId = `${FORM_NODE_ID}.Command.ОткрытьВнешний`
  graph.ensureNode(cmdNodeId, { name: "ОткрытьВнешний" })
  graph.addFilePath(cmdNodeId, FILE_PATH)
  graph.ensureEdge(FORM_NODE_ID, cmdNodeId, "FORM_COMMAND", { yaml: "КомандаФормы" })

  return graph
}

describe("CommandName buildGraphFromModel — ИмяКоманды", () => {
  it.each([
    ["Form.Command.Печать", "Catalog.Товары.Form.ФормаСписка.Command.Печать", "Печать"],
    ["CommonCommand.Напомнить", "CommonCommand.Напомнить", "Напомнить"],
    ["Отчет.Ведомость.Команда.Сформировать", "Report.Ведомость.Command.Сформировать", "Сформировать"],
    ["Обработка.Загрузка.Команда.Выполнить", "DataProcessor.Загрузка.Command.Выполнить", "Выполнить"],
  ])("резолвит %s в %s", (commandName, expectedId, expectedName) => {
    const result = buildCommandNameGraphOps(commandName, FORM_NODE_ID)

    expect(result).toMatchObject({
      edgeKind: "COMMAND_NAME",
      edgeYaml: "ИмяКоманды",
      references: [{ id: expectedId, name: expectedName }],
    })
  })

  it("не добавляет внутренние CommandName 0 в граф", () => {
    expect(buildCommandNameGraphOps("0", FORM_NODE_ID)).toBeUndefined()
    expect(buildCommandNameGraphOps("0:198ea630-fda2-4cda-8a23-f999f4c67ee6", FORM_NODE_ID)).toBeUndefined()
  })

  it("системную команду формы хранит на ребре к форме", () => {
    const result = buildCommandNameGraphOps("Form.StandardCommand.Help", FORM_NODE_ID)

    expect(result?.references?.[0]).toMatchObject({
      id: FORM_NODE_ID,
      name: "ФормаСписка",
      edgeProps: { commandScope: "form", standardCommand: "Help" },
    })
  })

  it("системную команду элемента хранит на ребре к элементу", () => {
    const result = buildCommandNameGraphOps(
      "Form.Item.Список.StandardCommand.Find",
      FORM_NODE_ID,
    )

    expect(result?.references?.[0]).toMatchObject({
      id: "Catalog.Товары.Form.ФормаСписка.Element.Список",
      name: "Список",
      edgeProps: { commandScope: "item", standardCommand: "Find", targetItemName: "Список" },
    })
  })

  it("объявляет команды формы с каноническим техническим сегментом Command", () => {
    const graph = new GraphBuilder()
    graph.ensureNode(FORM_NODE_ID, { name: "ФормаСписка" })

    buildGraphFromModel({
      model: {
        commands: [{ name: "Открыть", itemType: "FormCommand" }],
      },
      yamlMap: undefined,
      rule: ClientApplicationFormRules as never,
      graph,
      parentNodeId: FORM_NODE_ID,
      filePath: FILE_PATH,
    })

    expect(graph.hasNode("Catalog.Товары.Form.ФормаСписка.Command.Открыть")).toBe(true)
    expect(graph.hasNode("Catalog.Товары.Form.ФормаСписка.Команда.Открыть")).toBe(false)
  })

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

    const buttonNodeId = `${FORM_NODE_ID}.Element.КнопкаОткрыть`
    expect(graph.hasNode(buttonNodeId)).toBe(true)

    const commandEdges = [...graph.outEdgeEntries(buttonNodeId)].filter(
      (e) => e.attributes.kind === "COMMAND_NAME",
    )
    expect(commandEdges).toHaveLength(1)
    expect(commandEdges[0].target).toBe(`${FORM_NODE_ID}.Command.ОткрытьВнешний`)
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

    const buttonNodeId = `${FORM_NODE_ID}.Element.КнопкаОткрыть`
    const commandEdges = [...graph.outEdgeEntries(buttonNodeId)].filter(
      (e) => e.attributes.kind === "COMMAND_NAME",
    )
    // Ребро создано (к заглушке)
    expect(commandEdges).toHaveLength(1)
    const stubId = commandEdges[0].target
    expect(stubId).toBe(`${FORM_NODE_ID}.Command.НесуществующаяКоманда`)
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

    const buttonNodeId = `${FORM_NODE_ID}.Element.КнопкаОткрыть`
    const commandEdges = [...graph.outEdgeEntries(buttonNodeId)].filter(
      (e) => e.attributes.kind === "COMMAND_NAME",
    )
    expect(commandEdges).toHaveLength(0)
  })
})
