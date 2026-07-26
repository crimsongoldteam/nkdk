import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { createConfigurationIndexExportRuntime } from "../../configurationIndex/exportRuntime"
import { childSegmentUid } from "../../configurationIndex/logicalAddress"
import { snapshotConfigurationIndex, createConfigurationIndexReader } from "../../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../../configurationIndex/testData"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { configurationExtensionYamlToXmlAugmenter } from "./exportPropertyStates"

const BASE_UUID = "11111111-1111-1111-1111-111111111111"
const logicalAddress = "Catalog.Товары.Attribute.Дата"
const rule = {
  itemType: "ClientApplicationForm",
  properties: {
    format: { type: "string", yaml: "Формат", xml: "Format" },
    form: { type: "string", yaml: "Форма", xml: "Form" },
  },
} as const satisfies MetadataItemRule

describe("configuration extension YAML-to-XML augmenter", () => {
  it("writes adoption and ordered Notify/Extended states", () => {
    const outputs = new Map<string, Record<string, unknown>>([
      ["metadata", { Form: { Properties: {} } }],
      ["body", {}],
    ])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: { [logicalAddress]: BASE_UUID },
        extended: ["form"],
      }),
      rule,
      yaml: {
        Контроль: ["Формат", "ОбъектРасширяемойКонфигурации"],
      },
      outputs,
      logicalAddress,
    })

    const form = record(outputs.get("metadata")?.Form)
    expect(form.Properties).toMatchObject({
      ObjectBelonging: "Adopted",
      ExtendedConfigurationObject: BASE_UUID,
    })
    expect(record(form.InternalInfo)["xr:PropertyState"]).toEqual([
      { "xr:Property": "ExtendedConfigurationObject", "xr:State": "Notify" },
      { "xr:Property": "Format", "xr:State": "Notify" },
      { "xr:Property": "Form", "xr:State": "Extended" },
    ])
    expect(outputs.get("body")).toEqual({})
  })

  it("does not mark an own address as adopted", () => {
    const outputs = new Map([["metadata", { Form: { Properties: {} } }]])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: {} }),
      rule,
      yaml: {},
      outputs,
      logicalAddress,
    })

    expect(record(record(outputs.get("metadata")).Form).Properties).toEqual({})
  })

  it("rejects an unknown control name with the logical address", () => {
    expect(() =>
      configurationExtensionYamlToXmlAugmenter.augment({
        context: context({ adoptedUuids: {} }),
        rule,
        yaml: { Контроль: ["Неизвестное"] },
        outputs: new Map([["metadata", { Form: { Properties: {} } }]]),
        logicalAddress,
      })
    ).toThrow(`Неизвестное свойство Контроль "Неизвестное": ${logicalAddress}`)
  })

  it("prefers Notify when the same property is saved as Extended", () => {
    const outputs = new Map([["metadata", { Form: { Properties: {} } }]])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: {}, extended: ["form"] }),
      rule,
      yaml: { Контроль: ["Форма"] },
      outputs,
      logicalAddress,
    })

    expect(
      record(record(record(outputs.get("metadata")).Form).InternalInfo)["xr:PropertyState"]
    ).toEqual([
      { "xr:Property": "Form", "xr:State": "Notify" },
    ])
  })
})

function context(params: {
  adoptedUuids: Readonly<Record<string, string>>
  extended?: readonly string[]
}): ConfigurationContextWithExportToXML {
  const data = sampleIndex()
  const snapshot = snapshotConfigurationIndex(encodeConfigurationIndex({
    ...data,
    xmlValues: (params.extended ?? []).map((segment) => ({
      logicalAddress: childSegmentUid(logicalAddress, segment),
      extended: true as const,
    })),
  }))
  return {
    version: "2.20",
    defaultLanguage: "ru",
    exportToXML: {
      version: "2.20",
      itemsTree: [],

      adoptedUuids: params.adoptedUuids,
      componentKind: "configurationExtension",
      configurationIndex: createConfigurationIndexExportRuntime({
        source: createConfigurationIndexReader(snapshot),
        collector: createConfigurationIndexCollector(),
        targetProjectPath: "Форма.yaml",
        logicalAddress,
      }),
    },
  }
}

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}
