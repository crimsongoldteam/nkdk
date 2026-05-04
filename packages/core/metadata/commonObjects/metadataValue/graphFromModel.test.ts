import { describe, expect, it } from "vitest"
import { LineCounter, parseDocument } from "yaml"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { applyGraphOps } from "~/metadata/orchestration/buildGraph/internal/applyGraphOps"
import { extractSingleValueRef, buildMetadataValueGraph } from "./graphFromModel"
import {
  MetadataFixedArrayValue,
  MetadataFormChoiceListValue,
  MetadataRefValue,
  MetadataObjectRefValue,
  MetadataTypedValue,
} from "./types"

// Активирует регистрации side-effect (registerTypeRule)
import "./graphFromModel"

const PARENT_NODE = "Справочник.Товары"
const FILE_PATH = "test/Свойства.yaml"

function makeGraph() {
  const graph = new GraphBuilder()
  graph.ensureNode(PARENT_NODE, { name: "Товары" })
  graph.addFilePath(PARENT_NODE, FILE_PATH)
  return graph
}

function runBuild(
  params: Omit<Parameters<typeof buildMetadataValueGraph>[0], "lineCounter" | "propertyName"> & {
    lineCounter?: LineCounter
    graph: GraphBuilder
  },
) {
  const { graph, ...buildParams } = params
  const result = buildMetadataValueGraph({
    lineCounter: undefined,
    propertyName: "value",
    ...buildParams,
  })
  const sections = Array.isArray(result) ? result : result ? [result] : []
  for (const section of sections) {
    if (!section.edgeKind || !section.edgeYaml) continue
    applyGraphOps(section, {
      graph,
      parentNodeId: params.parentNodeId,
      filePath: params.filePath,
      edgeKind: section.edgeKind,
      edgeYaml: section.edgeYaml,
    })
  }
}

// ---------------------------------------------------------------------------
// extractSingleValueRef — табличные тесты
// ---------------------------------------------------------------------------

describe("extractSingleValueRef", () => {
  it("string → undefined", () => {
    const v: MetadataTypedValue = { type: "string", value: "текст" }
    expect(extractSingleValueRef(v)).toBeUndefined()
  })

  it("decimal → undefined", () => {
    const v: MetadataTypedValue = { type: "decimal", value: 42 }
    expect(extractSingleValueRef(v)).toBeUndefined()
  })

  it("boolean → undefined", () => {
    const v: MetadataTypedValue = { type: "boolean", value: true }
    expect(extractSingleValueRef(v)).toBeUndefined()
  })

  it("dateTime → undefined", () => {
    const v: MetadataTypedValue = { type: "dateTime", value: "2025-01-01T00:00:00" }
    expect(extractSingleValueRef(v)).toBeUndefined()
  })

  it("пустой ref (value='') → undefined", () => {
    const v: MetadataRefValue = { type: "ref", value: "" }
    expect(extractSingleValueRef(v)).toBeUndefined()
  })

  it("ref с ПустаяСсылка справочника → ребро kind Значение", () => {
    const v: MetadataRefValue = { type: "ref", value: "Catalog.Пользователи.EmptyRef" }
    const result = extractSingleValueRef(v, { offset: 10, line: 2, column: 5 })
    expect(result).toBeDefined()
    expect(result!.kind).toBe("VALUE")
    expect(result!.ref.id).toBe("Справочник.Пользователи.ПустаяСсылка")
    expect(result!.ref.name).toBe("ПустаяСсылка")
    expect(result!.ref.positionFrom).toEqual({ offset: 10, line: 2, column: 5 })
  })

  it("ref со значением перечисления (EnumValue) → ребро kind Значение без EnumValue в nodeId", () => {
    const v: MetadataRefValue = { type: "ref", value: "Enum.ВидыДоговоров.EnumValue.СПоставщиком" }
    const result = extractSingleValueRef(v)
    expect(result).toBeDefined()
    expect(result!.kind).toBe("VALUE")
    expect(result!.ref.id).toBe("Перечисление.ВидыДоговоров.СПоставщиком")
    expect(result!.ref.name).toBe("СПоставщиком")
  })

  it("ref с ПустаяСсылка перечисления → ребро kind Значение", () => {
    const v: MetadataRefValue = { type: "ref", value: "Enum.Статус.EmptyRef" }
    const result = extractSingleValueRef(v)
    expect(result).toBeDefined()
    expect(result!.ref.id).toBe("Перечисление.Статус.ПустаяСсылка")
  })

  it("objectRef → ребро kind Объект", () => {
    const v: MetadataObjectRefValue = {
      type: "objectRef",
      value: "ChartOfCharacteristicTypes.ДополнительныеРеквизиты",
    }
    const result = extractSingleValueRef(v, { offset: 5, line: 1, column: 6 })
    expect(result).toBeDefined()
    expect(result!.kind).toBe("OBJECT")
    expect(result!.ref.id).toBe("ПланВидовХарактеристик.ДополнительныеРеквизиты")
    expect(result!.ref.positionFrom).toEqual({ offset: 5, line: 1, column: 6 })
  })

  it("objectRef с Catalog → ребро kind Объект", () => {
    const v: MetadataObjectRefValue = { type: "objectRef", value: "Catalog.Контрагенты" }
    const result = extractSingleValueRef(v)
    expect(result).toBeDefined()
    expect(result!.kind).toBe("OBJECT")
    expect(result!.ref.id).toBe("Справочник.Контрагенты")
  })
})

// ---------------------------------------------------------------------------
// buildMetadataValueGraph — тесты через граф
// ---------------------------------------------------------------------------

describe("buildMetadataValueGraph", () => {
  it("примитив → не создаёт рёбер", () => {
    const graph = makeGraph()
    const value: MetadataTypedValue = { type: "string", value: "привет" }
    runBuild({
      model: value,
      parentNodeId: PARENT_NODE,
      filePath: FILE_PATH,
      yamlMap: undefined,
      propRule: { type: "MetadataValue", yaml: "ЗначениеЗаполнения" },
      graph,
    })
    expect([...graph.outEdgeEntries(PARENT_NODE)]).toHaveLength(0)
  })

  it("ref → создаёт ребро kind Значение", () => {
    const graph = makeGraph()
    const value: MetadataRefValue = { type: "ref", value: "Catalog.Пользователи.EmptyRef" }
    runBuild({
      model: value,
      parentNodeId: PARENT_NODE,
      filePath: FILE_PATH,
      yamlMap: undefined,
      propRule: { type: "MetadataValue", yaml: "ЗначениеЗаполнения" },
      graph,
    })

    const edges = [...graph.outEdgeEntries(PARENT_NODE)]
    expect(edges).toHaveLength(1)
    expect(edges[0].attributes.kind).toBe("VALUE")
    expect(edges[0].target).toBe("Справочник.Пользователи.ПустаяСсылка")
    expect(graph.hasNode("Справочник.Пользователи.ПустаяСсылка")).toBe(true)
  })

  it("objectRef → создаёт ребро kind Объект", () => {
    const graph = makeGraph()
    const value: MetadataObjectRefValue = { type: "objectRef", value: "Catalog.Контрагенты" }
    runBuild({
      model: value,
      parentNodeId: PARENT_NODE,
      filePath: FILE_PATH,
      yamlMap: undefined,
      propRule: { type: "MetadataValue", yaml: "Ссылка" },
      graph,
    })

    const edges = [...graph.outEdgeEntries(PARENT_NODE)]
    expect(edges).toHaveLength(1)
    expect(edges[0].attributes.kind).toBe("OBJECT")
    expect(edges[0].target).toBe("Справочник.Контрагенты")
  })

  it("undefined model → не создаёт рёбер", () => {
    const graph = makeGraph()
    runBuild({
      model: undefined,
      parentNodeId: PARENT_NODE,
      filePath: FILE_PATH,
      yamlMap: undefined,
      propRule: { type: "MetadataValue", yaml: "ЗначениеЗаполнения" },
      graph,
    })
    expect([...graph.outEdgeEntries(PARENT_NODE)]).toHaveLength(0)
  })

  describe("fixedArray", () => {
    it("пустой fixedArray → не создаёт рёбер", () => {
      const graph = makeGraph()
      const value: MetadataFixedArrayValue = { type: "fixedArray", value: [] }
      runBuild({
        model: value,
        parentNodeId: PARENT_NODE,
        filePath: FILE_PATH,
        yamlMap: undefined,
        propRule: { type: "MetadataValue", yaml: "ЗначениеЗаполнения" },
        graph,
      })
      expect([...graph.outEdgeEntries(PARENT_NODE)]).toHaveLength(0)
    })

    it("fixedArray из 3 ref → 3 ребра kind Значение", () => {
      const graph = makeGraph()
      const yaml = `
Свойство:
  - Перечисление.ТипыСчетов.КосвенныеЗатраты
  - Перечисление.ТипыСчетов.Расходы
  - Перечисление.ТипыСчетов.ПрямыеЗатраты
`
      const lineCounter = new LineCounter()
      const doc = parseDocument(yaml, { lineCounter })
      const yamlMap = doc.contents as any

      const items: MetadataTypedValue[] = [
        { type: "ref", value: "Enum.ТипыСчетов.EnumValue.КосвенныеЗатраты" },
        { type: "ref", value: "Enum.ТипыСчетов.EnumValue.Расходы" },
        { type: "ref", value: "Enum.ТипыСчетов.EnumValue.ПрямыеЗатраты" },
      ]
      const value: MetadataFixedArrayValue = { type: "fixedArray", value: items }

      runBuild({
        model: value,
        parentNodeId: PARENT_NODE,
        filePath: FILE_PATH,
        yamlMap,
        lineCounter,
        propRule: { type: "MetadataValue", yaml: "Свойство" },
        graph,
      })

      const edges = [...graph.outEdgeEntries(PARENT_NODE)]
      expect(edges).toHaveLength(3)
      expect(edges.every((e) => e.attributes.kind === "VALUE")).toBe(true)

      // Позиции у разных элементов должны различаться
      const positions = edges.map((e) => e.attributes.positionFrom?.offset)
      expect(positions[0]).toBeDefined()
      expect(positions[1]).toBeDefined()
      expect(positions[2]).toBeDefined()
      expect(new Set(positions).size).toBe(3)

      // Целевые узлы
      const targets = edges.map((e) => e.target)
      expect(targets).toContain("Перечисление.ТипыСчетов.КосвенныеЗатраты")
      expect(targets).toContain("Перечисление.ТипыСчетов.Расходы")
      expect(targets).toContain("Перечисление.ТипыСчетов.ПрямыеЗатраты")
    })
  })

  describe("formChoiceListDesTimeValue", () => {
    it("formChoiceList без value → не создаёт рёбер", () => {
      const graph = makeGraph()
      const value: MetadataFormChoiceListValue = {
        type: "formChoiceListDesTimeValue",
        presentation: { items: { ru: "Текст" } },
        value: undefined,
      }
      runBuild({
        model: value,
        parentNodeId: PARENT_NODE,
        filePath: FILE_PATH,
        yamlMap: undefined,
        propRule: { type: "MetadataValue", yaml: "Поле" },
        graph,
      })
      expect([...graph.outEdgeEntries(PARENT_NODE)]).toHaveLength(0)
    })

    it("formChoiceList с вложенным ref → 1 ребро kind Значение", () => {
      const graph = makeGraph()
      const value: MetadataFormChoiceListValue = {
        type: "formChoiceListDesTimeValue",
        presentation: { items: { ru: "Физическое лицо" } },
        value: { type: "ref", value: "Enum.ВидыДоговоров.EnumValue.СПоставщиком" },
      }
      runBuild({
        model: value,
        parentNodeId: PARENT_NODE,
        filePath: FILE_PATH,
        yamlMap: undefined,
        propRule: { type: "MetadataValue", yaml: "Поле" },
        graph,
      })

      const edges = [...graph.outEdgeEntries(PARENT_NODE)]
      expect(edges).toHaveLength(1)
      expect(edges[0].attributes.kind).toBe("VALUE")
      expect(edges[0].target).toBe("Перечисление.ВидыДоговоров.СПоставщиком")
    })

    it("formChoiceList с вложенной строкой → не создаёт рёбер", () => {
      const graph = makeGraph()
      const value: MetadataFormChoiceListValue = {
        type: "formChoiceListDesTimeValue",
        presentation: { items: { ru: "Метка" } },
        value: { type: "string", value: "строка" },
      }
      runBuild({
        model: value,
        parentNodeId: PARENT_NODE,
        filePath: FILE_PATH,
        yamlMap: undefined,
        propRule: { type: "MetadataValue", yaml: "Поле" },
        graph,
      })
      expect([...graph.outEdgeEntries(PARENT_NODE)]).toHaveLength(0)
    })
  })
})
