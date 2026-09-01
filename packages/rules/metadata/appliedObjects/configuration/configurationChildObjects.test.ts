import { describe, expect, it } from "vitest"
import {
  createConfigurationIndexCollector,
  createConfigurationIndexExportRuntime,
  createLocalConfigurationIndexReader,
  importContentFromXML,
  withConfigurationIndexCollector,
  xmlExport,
} from "@nkdk/runtime"
import type { ConfigurationIndexChild } from "@nkdk/runtime"
import { mockContextFromXML } from "../../../tests/mockContext"
import { getTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { configurationChildObjectsRule } from "./builders"
import type { ConfigurationChildObjectsXML } from "./childObjects"
import { configurationChildObjectsFromIndex } from "./configurationChildObjects"

const address = "Конфигурация.Свойство.childObjects"

describe("ConfigurationChildObjects children", () => {
  it("reads every repeated XML kind only once while restoring child order", () => {
    const itemCount = 200
    let itemReads = 0
    const names = new Proxy(
      Array.from({ length: itemCount }, (_, index) => `Документ${index}`),
      {
        get(target, key, receiver) {
          if (typeof key === "string" && /^(0|[1-9]\d*)$/u.test(key)) itemReads += 1
          return Reflect.get(target, key, receiver)
        },
      },
    )
    const current: ConfigurationChildObjectsXML = { Document: names }
    Object.defineProperty(current, Symbol.for("metadata"), {
      value: {
        childOrder: names.map((_name, index) => ({ key: "Document", index })),
      },
    })
    itemReads = 0

    configurationChildObjectsFromIndex(undefined, current)

    expect(itemReads).toBeLessThanOrEqual(itemCount * 2)
  })

  it("does not store canonical type and Russian-name order", () => {
    const collector = collect({ Language: ["Английский", "Русский"], Catalog: ["Товары", "Услуги"] })
    expect(collector.fragment("Конфигурация.yaml").entities).toEqual([])
  })

  it("stores only a type whose name order is noncanonical", () => {
    const collector = collect({ Language: ["Русский", "Английский"], Catalog: ["Товары", "Услуги"] })
    expect(collector.fragment("Конфигурация.yaml").entities).toEqual([{
      logicalAddress: address,
      children: [
        { xmlName: "Language", name: "Русский" },
        { xmlName: "Language", name: "Английский" },
      ],
    }])
  })

  it("stores and restores a full flat list when XML kinds are interleaved", () => {
    const source = [
      "<ChildObjects>",
      "\t<Catalog>Товары</Catalog>",
      "\t<Document>Заказ</Document>",
      "\t<Catalog>Услуги</Catalog>",
      "</ChildObjects>",
    ].join("\n")
    const parsed = importContentFromXML<{ ChildObjects: ConfigurationChildObjectsXML }>(source)
    const children = collect(parsed.ChildObjects).fragment("Конфигурация.yaml").entities[0]!.children!
    expect(children).toHaveLength(3)
    const restored = configurationChildObjectsFromIndex(exportRuntime(children), parsed.ChildObjects)
    expect(xmlExport({ ChildObjects: restored }, false)).toBe(source)
  })

  it("removes deleted items and appends new names by canonical order", () => {
    const runtime = exportRuntime([
      { xmlName: "Catalog", name: "Товары" },
      { xmlName: "Catalog", name: "Удалён" },
    ])
    expect(configurationChildObjectsFromIndex(runtime, { Catalog: ["Новый", "Товары"] })).toEqual({
      Catalog: ["Товары", "Новый"],
    })
  })

  it("rejects duplicate current pairs", () => {
    expect(() => configurationChildObjectsFromIndex(undefined, { Catalog: ["Товары", "Товары"] })).toThrow(
      "Дублирующаяся пара",
    )
  })
})

function collect(xml: ConfigurationChildObjectsXML) {
  const collector = createConfigurationIndexCollector()
  const context = withConfigurationIndexCollector(mockContextFromXML(), collector, address)
  const rule = configurationChildObjectsRule({ xml: "ChildObjects", toYAML: false, fromYAML: false, toXML: false })
  getTypeRule("ConfigurationChildObjects", "collectConfigurationIndexFromXML")?.({
    context,
    rule,
    xml,
    propertyKey: "childObjects",
  })
  return collector
}

function exportRuntime(children: readonly ConfigurationIndexChild[]) {
  return createConfigurationIndexExportRuntime({
    source: createLocalConfigurationIndexReader(new Map([["Конфигурация.yaml", { entities: [{ logicalAddress: address, children }] }]])),
    collector: createConfigurationIndexCollector(),
    targetProjectPath: "Конфигурация.yaml",
    logicalAddress: "Конфигурация",
    operationSeed: new Uint8Array(32),
  })
}
