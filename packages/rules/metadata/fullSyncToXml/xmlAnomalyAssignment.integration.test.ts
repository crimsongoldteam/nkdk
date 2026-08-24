import {
  parseMetadataYaml,
  parseXmlDocumentWithSaxes,
  type XmlAnomalyRuntime,
} from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { describe, expect, it, vi } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import {
  buildPreparedAssignmentXml,
  prepareXmlAnomalyAssignment,
} from "./xmlAnomalyAssignment"

const rule = {
  itemType: "SyntheticOwner",
  properties: {
    invalid: { type: "string", yaml: "Неверное", xml: "Invalid" },
    important: { type: "string", yaml: "Важное", xml: "Important" },
    expanded: { type: "string", yaml: "Развернутое", xml: "Expanded" },
    missing: { type: "string", yaml: "Отсутствует", xml: "Missing", defaultValueXML: "default" },
    compact: { type: "string", yaml: "Компактное", xml: "Compact" },
    name: { type: "string", yaml: "Имя", xml: "Name" },
  },
} as const satisfies MetadataItemRule

describe("единое восстановление XML-аномалий assignment", () => {
  it("передаёт invalid/important обычному экспорту и извлекает raw до fromYAML", () => {
    const yaml = [
      "Неверное: !xml/invalid bad",
      "Важное: !xml/important keep",
      'Развернутое: !xml/raw "01"',
      "Отсутствует: !xml/raw null",
      "Компактное: !xml/raw",
      "Имя: !xml/raw ВнешнееИмя",
      'Properties\\Future: !xml/raw "future"',
    ].join("\n")
    const generateCompactRaw = vi.fn(() =>
      parseXmlDocumentWithSaxes('<Compact generated="yes"/>').roots
    )
    const runtime = anomalyRuntime({ generateCompactRaw })

    const prepared = prepareAnomalies(yaml, runtime)

    expect(prepared.itemName).toBe("ВнешнееИмя")
    expect(prepared.preparedYamlFile.data).toEqual({
      Неверное: "bad",
      Важное: "keep",
      Имя: "ВнешнееИмя",
    })
    expect(prepared.rawBoundaries.map(({ path }) => path)).toEqual([
      "Expanded",
      "Missing",
      "Compact",
      "Properties\\Future",
    ])
    expect(generateCompactRaw).toHaveBeenCalledOnce()
  })

  it("объединяет expanded/compact raw после deferred и подавляет default через raw null", () => {
    const yaml = [
      'Развернутое: !xml/raw "01"',
      "Отсутствует: !xml/raw null",
      "Компактное: !xml/raw",
      'Properties\\Future: !xml/raw "future"',
    ].join("\n")
    const prepared = prepareAnomalies(yaml, anomalyRuntime({
      generateCompactRaw: () => parseXmlDocumentWithSaxes("<Compact><Generated>true</Generated></Compact>").roots,
    }))

    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Objects/One.xml",
        xml: {
          Root: {
            Expanded: "ordinary",
            Missing: "default",
            Deferred: "before",
          },
        },
        deferred: [],
        rootRule: rule,
        rawBoundaries: prepared.rawBoundaries,
      },
      context: mockContextToXML(),
    })
    const root = parseXmlDocumentWithSaxes(xml).compatibility.Root as Record<string, unknown>

    expect(root).toMatchObject({
      Expanded: "01",
      Compact: { Generated: "true" },
      Properties: { Future: "future" },
    })
    expect(root).not.toHaveProperty("Missing")
  })

  it("не изменяет исходный XML-документ при чистой сборке", () => {
    const xml = { Root: { Value: "before" } }

    buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml,
        deferred: [],
        rootRule: rule,
        rawBoundaries: [],
      },
      context: mockContextToXML(),
    })

    expect(xml).toEqual({ Root: { Value: "before" } })
  })

  it("отклоняет скрытое внешнее имя нестрокового вида", () => {
    expect(() => prepareAnomalies(
      "Имя: !xml/raw {}\n",
      anomalyRuntime({ generateCompactRaw: () => undefined }),
    )).toThrow("должно быть непустой строкой")
  })

  it("сохраняет служебный порядок XML-дочерних элементов в чистой сборке", () => {
    const root = { First: "first", Second: "second" }
    Object.defineProperty(root, Symbol.for("xmlOrderedChildren"), {
      enumerable: false,
      value: [
        { key: "Second", value: "second" },
        { key: "First", value: "first" },
      ],
    })

    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml: { Root: root },
        deferred: [],
        rootRule: rule,
        rawBoundaries: [],
      },
      context: mockContextToXML(),
    })

    expect(xml.indexOf("<Second>")).toBeLessThan(xml.indexOf("<First>"))
  })

  it("разрешает invalid-ключу иметь raw-значение", () => {
    const prepared = prepareAnomalies(
      '!xml/invalid Развернутое: !xml/raw "01"\n',
      anomalyRuntime({ generateCompactRaw: () => undefined }),
    )

    expect(prepared.preparedYamlFile.data).toEqual({})
    expect(prepared.rawBoundaries).toEqual([
      expect.objectContaining({ path: "Expanded", value: "01" }),
    ])
  })
})

function anomalyRuntime(overrides: {
  generateCompactRaw: XmlAnomalyRuntime["generateCompactRaw"]
}): XmlAnomalyRuntime {
  return {
    requiresImportant: () => false,
    allowsHiddenSingletonName: ({ propertyKey }) => propertyKey === "name",
    generateCompactRaw: overrides.generateCompactRaw,
  }
}

function prepareAnomalies(yaml: string, runtime: XmlAnomalyRuntime) {
  const parsed = parseMetadataYaml(yaml)
  return prepareXmlAnomalyAssignment({
    preparedYamlFile: {
      projectPath: "Объект/Один/Свойства.yaml",
      filePath: "/project/Объект/Один/Свойства.yaml",
      role: "properties",
      owner: { dir: "Объект", name: "Один" },
      data: parsed.data,
      annotations: parsed.annotations,
      syntaxDiagnostics: [],
    },
    rootRule: rule,
    itemName: "Один",
    runtime,
  })
}
