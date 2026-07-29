import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { createConfigurationIndexExportRuntime } from "../../configurationIndex/exportRuntime"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "../../configurationIndex/sharedSnapshot"
import { sampleSnapshot } from "../../configurationIndex/testData"
import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { xmlExport } from "../../../xml/export/exporter"
import { importContentFromXML } from "../../../xml/import/importer"
import { configurationChildObjectsRule } from "./builders"
import type { ConfigurationChildObjectsXML } from "./childObjects"
import { configurationChildObjectsFromIndex } from "./configurationChildObjects"

const address = "Конфигурация.Свойство.childObjects"

describe("ConfigurationChildObjects omittedChildren", () => {
  it("собирает реальные пары xmlName и name без строкового кодирования", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), collector, address)
    const collect = getTypeRule("ConfigurationChildObjects", "collectConfigurationIndexFromXML")
    const rule = configurationChildObjectsRule({
      xml: "ChildObjects",
      toYAML: false,
      fromYAML: false,
      toXML: false,
    })

    collect?.({
      context,
      rule,
      xml: {
        Language: ["Русский", "Английский"],
        Catalog: "Товары",
      },
      propertyKey: "childObjects",
    })

    expect(collector.fragment("Конфигурация.yaml").entities).toEqual([
      {
        logicalAddress: address,
        sourceProjectPath: "Конфигурация.yaml",
        omittedChildren: {
          kind: "typedNames",
          items: [
            { xmlName: "Language", name: "Русский" },
            { xmlName: "Language", name: "Английский" },
            { xmlName: "Catalog", name: "Товары" },
          ],
        },
      },
    ])
  })

  it("сохраняет межтиповое чередование A/B/A в настоящем XML round-trip", () => {
    const source = [
      "<ChildObjects>",
      "\t<Catalog>Товары</Catalog>",
      "\t<Document>Заказ</Document>",
      "\t<Catalog>Услуги</Catalog>",
      "</ChildObjects>",
    ].join("\n")
    const parsed = importContentFromXML<{ ChildObjects: ConfigurationChildObjectsXML }>(source)
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), collector, address)
    const collect = getTypeRule("ConfigurationChildObjects", "collectConfigurationIndexFromXML")
    const rule = configurationChildObjectsRule({
      xml: "ChildObjects",
      toYAML: false,
      fromYAML: false,
      toXML: false,
    })

    collect?.({
      context,
      rule,
      xml: parsed.ChildObjects,
      propertyKey: "childObjects",
    })
    const omittedChildren = collector.fragment("Конфигурация.yaml").entities[0]?.omittedChildren
    expect(omittedChildren).toEqual({
      kind: "typedNames",
      items: [
        { xmlName: "Catalog", name: "Товары" },
        { xmlName: "Document", name: "Заказ" },
        { xmlName: "Catalog", name: "Услуги" },
      ],
    })

    const restored = configurationChildObjectsFromIndex(exportRuntime(omittedChildren!), parsed.ChildObjects)
    expect(xmlExport({ ChildObjects: restored }, false)).toBe(source)
  })

  it("сохраняет порядок существующих пар и добавляет новые из текущего состава", () => {
    const runtime = exportRuntime({
      kind: "typedNames",
      items: [
        { xmlName: "Catalog", name: "Товары" },
        { xmlName: "Language", name: "Русский" },
        { xmlName: "Document", name: "Удалён" },
        { xmlName: "Language", name: "Английский" },
      ],
    })

    expect(
      configurationChildObjectsFromIndex(runtime, {
        Language: ["Английский", "Русский"],
        Catalog: ["Новый", "Товары"],
        Document: "Заказ",
      })
    ).toEqual({
      Catalog: ["Товары", "Новый"],
      Language: ["Русский", "Английский"],
      Document: "Заказ",
    })
    expect(runtime.collector.fragment("Конфигурация.yaml").entities).toEqual([
      {
        logicalAddress: address,
        sourceProjectPath: "Конфигурация.yaml",
        omittedChildren: {
          kind: "typedNames",
          items: [
            { xmlName: "Catalog", name: "Товары" },
            { xmlName: "Language", name: "Русский" },
            { xmlName: "Language", name: "Английский" },
            { xmlName: "Catalog", name: "Новый" },
            { xmlName: "Document", name: "Заказ" },
          ],
        },
      },
    ])
  })

  it("не переносит omittedChildren при пустом текущем составе", () => {
    const runtime = exportRuntime({
      kind: "typedNames",
      items: [{ xmlName: "Catalog", name: "Удалён" }],
    })

    expect(configurationChildObjectsFromIndex(runtime, {})).toEqual({})
    expect(runtime.collector.fragment("Конфигурация.yaml").entities).toEqual([])
  })

  it("отклоняет names из снимка", () => {
    const runtime = exportRuntime({ kind: "names", names: ["Товары"] })

    expect(() => configurationChildObjectsFromIndex(runtime, {})).toThrow(
      "ConfigurationChildObjects ожидает omittedChildren.kind = typedNames"
    )
  })

  it("отклоняет повторную текущую пару", () => {
    expect(() =>
      configurationChildObjectsFromIndex(undefined, {
        Catalog: ["Товары", "Товары"],
      })
    ).toThrow("Дублирующаяся пара Catalog/Товары")
  })

  it("отклоняет повторную сохранённую пару", () => {
    const runtime = exportRuntime({
      kind: "typedNames",
      items: [
        { xmlName: "Catalog", name: "Товары" },
        { xmlName: "Catalog", name: "Товары" },
      ],
    })

    expect(() => configurationChildObjectsFromIndex(runtime, { Catalog: "Товары" })).toThrow(
      "Дублирующаяся пара Catalog/Товары"
    )
  })
})

function exportRuntime(
  omittedChildren: NonNullable<ReturnType<typeof sampleSnapshot>["entities"][number]["omittedChildren"]>
) {
  const snapshot = sampleSnapshot()
  const source = createConfigurationIndexReader(
    snapshotConfigurationIndex(
      encodeConfigurationIndex({
        ...snapshot,
        entities: [
          ...snapshot.entities.filter((entity) => entity.logicalAddress !== address),
          {
            logicalAddress: address,
            sourceProjectPath: "Configuration.yaml",
            omittedChildren,
          },
        ],
      })
    )
  )
  return createConfigurationIndexExportRuntime({
    source,
    collector: createConfigurationIndexCollector(),
    targetProjectPath: "Конфигурация.yaml",
    logicalAddress: "Конфигурация",
  })
}
